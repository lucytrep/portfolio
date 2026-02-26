(function () {
  var STORAGE_KEY = 'work_unlocked';
  var PASSWORD = 'lucytrep.labs';

  var lockScreen = document.getElementById('work-lock-screen');
  var workContent = document.getElementById('work-content');
  var form = document.getElementById('work-lock-form');
  var input = document.getElementById('work-lock-password');
  var message = document.getElementById('work-lock-message');

  function unlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
    if (lockScreen) lockScreen.classList.add('is-hidden');
    if (workContent) workContent.classList.remove('work-lock-hidden');
  }

  function showError(text) {
    if (message) {
      message.textContent = text || 'Incorrect password. Try again.';
      message.setAttribute('role', 'alert');
    }
  }

  function clearError() {
    if (message) {
      message.textContent = '';
      message.removeAttribute('role');
    }
  }

  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    unlock();
    return;
  }

  if (form && input) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();
      if (input.value.trim() === PASSWORD) {
        unlock();
      } else {
        showError('Incorrect password. Try again.');
        input.value = '';
        input.focus();
      }
    });
  }
})();
