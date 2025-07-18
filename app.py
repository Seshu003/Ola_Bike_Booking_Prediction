import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from flask import Flask, render_template, request, jsonify

train = pd.read_csv(r'train.csv')

X_train = train[['season', 'holiday', 'temp', 'atemp', 'humidity', 'windspeed']]
y_train = train['count']

X_train, X_test, y_train, y_test = train_test_split(X_train, y_train, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print("Mean Squared Error:", mse)

train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)
print(f"Training accuracy: {train_score}")
print(f"Testing accuracy: {test_score}")

app = Flask(__name__, template_folder='views')

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400
    
    form_data = request.json
    
    try:
        temperature = int(form_data['temp'])
        atm_temperature = int(form_data['a_temp'])
        humidity = int(form_data['humidity'])
        wind_speed = float(form_data['wind'])
        
        season_mapping = {'summer': 1, 'spring': 2, 'winter': 3, 'rainy': 4}
        season = season_mapping.get(form_data['seasons'], 0)
        
        day_mapping = {'holiday': 1, 'work': 0}
        day = day_mapping.get(form_data['day'], 0)
        
    except ValueError:
        return jsonify({'error': 'Invalid input data'}), 400
    
    input_data = pd.DataFrame({
        'season': [season],
        'holiday': [day],
        'temp': [temperature],
        'atemp': [atm_temperature],
        'humidity': [humidity],
        'windspeed': [wind_speed]
    })
    
    prediction = model.predict(input_data)
    return jsonify({'prediction': prediction.tolist()})

if __name__ == '__main__':
    app.run(debug=True)
