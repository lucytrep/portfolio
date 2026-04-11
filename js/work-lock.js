(function () {
  var STORAGE_KEY = 'work_unlocked';
  var PASSWORD_HASH = '86ba97911dbe32559b19994bdb49f21152da1d5da59f90168f894609b8127577';

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

  function hashInput(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    unlock();
    return;
  }

  if (form && input) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();
      hashInput(input.value.trim()).then(function (hash) {
        if (hash === PASSWORD_HASH) {
          unlock();
        } else {
          showError('Incorrect password. Try again.');
          input.value = '';
          input.focus();
        }
      });
    });
  }
})();
