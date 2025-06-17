// Newsletter form handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('newsletter-form') as HTMLFormElement;
  const emailInput = document.getElementById('email-input') as HTMLInputElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const messageDiv = document.getElementById('form-message') as HTMLDivElement;

  if (!form || !emailInput || !submitBtn || !messageDiv) {
    return; // Elements not found, exit early
  }

  // Google Apps Script Web App URL - replace with your new deployment URL
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby21sdi3K9dkshMimhcOVdnxoJi9TwihcMu52aM-1gbyfdVAcvfXI7WoheA2GYxbqUs/exec';

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
    submitBtn.textContent = '...';

    try {
      // Use URLSearchParams instead of FormData for better compatibility
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('timestamp', new Date().toISOString());

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      if (response.ok) {
        // Replace input content with thank you message and make it non-editable
        emailInput.value = 'Thank you!';
        emailInput.disabled = true;
        emailInput.style.color = 'var(--secondary)';
        emailInput.style.fontWeight = 'bold';
        emailInput.style.textAlign = 'center';
        
        // Hide the submit button or disable it permanently
        submitBtn.style.display = 'none';
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showMessage('Something went wrong. Please try again later.', 'error');
      
      // Reset button state on error
      submitBtn.disabled = false;
      submitBtn.textContent = '→';
    }
  });

  // Add enter key support
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });
}); 