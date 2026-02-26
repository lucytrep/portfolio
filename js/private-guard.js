// Guard private project pages behind the same work.html password gate.
// If the session is not unlocked, redirect to work.html.
(function () {
  var STORAGE_KEY = 'work_unlocked';

  try {
    if (!window.sessionStorage || sessionStorage.getItem(STORAGE_KEY) !== '1') {
      window.location.href = '../work.html';
    }
  } catch (e) {
    window.location.href = '../work.html';
  }
})();

