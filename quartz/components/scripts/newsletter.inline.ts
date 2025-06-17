// Newsletter form handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('newsletter-form') as HTMLFormElement;
  const emailInput = document.getElementById('email-input') as HTMLInputElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const messageDiv = document.getElementById('form-message') as HTMLDivElement;

  if (!form || !emailInput || !submitBtn || !messageDiv) {
    return; // Elements not found, exit early
  }

  // Google Apps Script Web App URL - this will need to be updated with your actual URL
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGI3sEM5XOFQNJ8OnrLDEF4m9GHgzleEoH9EzlXtiZhzzxthjAUdAuQgzBMQMfyN9zYA/exec';

  function showMessage(text: string, type: 'success' | 'error') {
    messageDiv.textContent = text;
    messageDiv.className = `form-message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'form-message';
    }, 5000);
  }

  function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
      showMessage('Please enter your email address.', 'error');
      return;
    }
    
    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showMessage('Thank you for subscribing! 🎉', 'success');
        emailInput.value = '';
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showMessage('Something went wrong. Please try again later.', 'error');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = 'Subscribe';
    }
  });

  // Add enter key support
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });
}); 