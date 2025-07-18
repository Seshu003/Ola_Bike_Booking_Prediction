// script.js - Enhanced version with proper DOM element handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('predictionForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resultCard = document.getElementById('resultCard');
    const predictionNumber = document.getElementById('predictionNumber');
    const demandIndicator = document.getElementById('demandIndicator');
    const toast = document.getElementById('toast');

    // Check if all required elements exist
    if (!form || !loadingOverlay || !resultCard || !predictionNumber || !demandIndicator || !toast) {
        console.error('Required DOM elements not found');
        return;
    }

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading overlay
        showLoading();
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            seasons: formData.get('seasons'),
            day: formData.get('day'),
            temp: parseInt(formData.get('temp')),
            a_temp: parseInt(formData.get('a_temp')),
            humidity: parseInt(formData.get('humidity')),
            wind: parseFloat(formData.get('wind'))
        };
        
        // Validate form data
        if (!validateFormData(data)) {
            hideLoading();
            showToast('Please fill in all fields correctly', 'error');
            return;
        }
        
        try {
            // Make API call to Flask backend
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Hide loading overlay
            hideLoading();
            
            // Display result
            displayResult(result.prediction[0]);
            
            // Show success toast
            showToast('Prediction completed successfully!', 'success');
            
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            showToast('Error making prediction. Please try again.', 'error');
        }
    });

    // Validate form data
    function validateFormData(data) {
        return data.seasons && data.day && 
               !isNaN(data.temp) && !isNaN(data.a_temp) && 
               !isNaN(data.humidity) && !isNaN(data.wind);
    }

    // Display prediction result
    function displayResult(prediction) {
        const roundedPrediction = Math.round(prediction);
        
        // Update result number with animation
        animateNumber(predictionNumber, 0, roundedPrediction, 1500);
        
        // Update demand status
        updateDemandStatus(roundedPrediction);
        
        // Update recommendation
        updateRecommendation(roundedPrediction);
        
        // Scroll to result with smooth animation
        setTimeout(() => {
            resultCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 500);
    }

    // Update demand status based on prediction
    function updateDemandStatus(prediction) {
        const indicatorBar = demandIndicator.querySelector('.indicator-bar');
        const indicatorText = demandIndicator.querySelector('.indicator-text');
        
        if (!indicatorBar || !indicatorText) {
            console.error('Demand indicator elements not found');
            return;
        }
        
        let level, color, percentage;
        
        if (prediction < 100) {
            level = 'Low';
            color = 'var(--success-color)';
            percentage = '25%';
        } else if (prediction < 300) {
            level = 'Medium';
            color = 'var(--warning-color)';
            percentage = '60%';
        } else {
            level = 'High';
            color = 'var(--error-color)';
            percentage = '90%';
        }
        
        // Create or update the indicator fill
        let indicatorFill = indicatorBar.querySelector('.indicator-fill');
        if (!indicatorFill) {
            indicatorFill = document.createElement('div');
            indicatorFill.className = 'indicator-fill';
            indicatorBar.appendChild(indicatorFill);
        }
        
        // Animate the indicator
        indicatorFill.style.width = '0%';
        indicatorFill.style.background = color;
        indicatorFill.style.height = '100%';
        indicatorFill.style.transition = 'width 1s ease';
        
        setTimeout(() => {
            indicatorFill.style.width = percentage;
        }, 100);
        
        // Update text
        indicatorText.textContent = `${level} demand expected`;
        indicatorText.style.color = color;
    }

    // Update recommendation based on prediction
    function updateRecommendation(prediction) {
        const recommendation = document.getElementById('recommendation');
        if (!recommendation) return;
        
        const icon = recommendation.querySelector('i');
        const text = recommendation.querySelector('span');
        
        if (!icon || !text) return;
        
        if (prediction < 100) {
            icon.className = 'fas fa-leaf';
            text.textContent = 'Low demand period - perfect for maintenance and driver breaks';
            recommendation.style.borderLeft = '4px solid var(--success-color)';
        } else if (prediction < 300) {
            icon.className = 'fas fa-balance-scale';
            text.textContent = 'Moderate demand - maintain current fleet deployment';
            recommendation.style.borderLeft = '4px solid var(--warning-color)';
        } else {
            icon.className = 'fas fa-rocket';
            text.textContent = 'High demand expected - deploy additional drivers and vehicles';
            recommendation.style.borderLeft = '4px solid var(--error-color)';
        }
    }

    // Animate number counting
    function animateNumber(element, start, end, duration) {
        if (!element) return;
        
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * easeOutQuart(progress));
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = end; // Ensure final value is exact
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    // Easing function for smooth animation
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    // Show loading overlay
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide loading overlay
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    // Show toast notification
    function showToast(message, type) {
        if (!toast) return;
        
        const toastIcon = toast.querySelector('.toast-icon');
        const toastTitle = toast.querySelector('.toast-title');
        const toastMessage = toast.querySelector('.toast-message');
        
        if (!toastIcon || !toastTitle || !toastMessage) {
            console.error('Toast elements not found');
            return;
        }
        
        // Set content based on type
        if (type === 'success') {
            toastIcon.className = 'toast-icon fas fa-check-circle';
            toastTitle.textContent = 'Success';
            toast.className = 'toast success';
        } else if (type === 'error') {
            toastIcon.className = 'toast-icon fas fa-exclamation-circle';
            toastTitle.textContent = 'Error';
            toast.className = 'toast error';
        }
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Smooth scrolling for navigation and buttons
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Enhanced form validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        
        // Remove existing error styling
        field.classList.remove('error');
        
        // Basic validation
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, 'This field is required');
            return false;
        }
        
        // Number validation
        if (field.type === 'number') {
            const num = parseFloat(value);
            const min = parseFloat(field.getAttribute('min'));
            const max = parseFloat(field.getAttribute('max'));
            
            if (isNaN(num)) {
                showFieldError(field, 'Please enter a valid number');
                return false;
            }
            
            if (min !== null && num < min) {
                showFieldError(field, `Value must be at least ${min}`);
                return false;
            }
            
            if (max !== null && num > max) {
                showFieldError(field, `Value must be at most ${max}`);
                return false;
            }
        }
        
        return true;
    }

    function showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    function clearFieldError(e) {
        const field = e.target;
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }

    // Initialize dashboard animations
    initializeDashboardAnimations();
    
    function initializeDashboardAnimations() {
        const bars = document.querySelectorAll('.bar');
        const metrics = document.querySelectorAll('.metric');
        
        // Animate chart bars
        bars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.transform = 'scaleY(1)';
                bar.style.opacity = '1';
            }, index * 100);
        });
        
        // Animate metrics
        metrics.forEach((metric, index) => {
            setTimeout(() => {
                metric.style.transform = 'translateY(0)';
                metric.style.opacity = '1';
            }, 500 + index * 100);
        });
    }

    // Add scroll effects
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(17, 17, 17, 0.98)';
            } else {
                navbar.style.background = 'rgba(17, 17, 17, 0.95)';
            }
        }
    });
});

// Additional CSS for indicators that might be missing
const additionalStyles = `
    .indicator-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 1s ease;
    }
    
    .nav-links.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(17, 17, 17, 0.98);
        padding: 1rem;
        border-top: 1px solid var(--border-color);
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(6px, -6px);
    }
    
    .bar {
        transform: scaleY(0);
        opacity: 0.6;
        transition: transform 0.6s ease, opacity 0.3s ease;
        transform-origin: bottom;
    }
    
    .metric {
        transform: translateY(20px);
        opacity: 0;
        transition: transform 0.6s ease, opacity 0.3s ease;
    }
    
    #recommendation {
        transition: border-left 0.3s ease;
        padding-left: 1rem;
    }
`;

// Add the additional styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
    