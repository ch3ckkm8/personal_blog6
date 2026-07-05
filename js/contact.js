
$(document).ready(function () {

  /* ── Helpers ─────────────────────────────────────────────────── */

  // Mark a field as valid (green ring, hide error)
  function setValid($field) {
    $field.removeClass('is-invalid').addClass('is-valid');
    $field.siblings('.invalid-feedback').text('');
  }

  // Mark a field as invalid (red ring, show error message)
  function setInvalid($field, msg) {
    $field.removeClass('is-valid').addClass('is-invalid');
    $field.siblings('.invalid-feedback').text(msg);
  }

  // Clear all validation states on the form
  function clearValidation() {
    $('.contact-form .form-control, .contact-form .form-select')
      .removeClass('is-valid is-invalid');
    $('.contact-form .invalid-feedback').text('');
  }

  /* ── Field-level validators ──────────────────────────────────── */

  function validateName($el) {
    const val = $el.val().trim();
    if (!val) {
      setInvalid($el, 'Name is required.');
      return false;
    }
    if (val.length < 2) {
      setInvalid($el, 'Name must be at least 2 characters.');
      return false;
    }
    setValid($el);
    return true;
  }

  function validateEmail($el) {
    const val = $el.val().trim();
    // Basic RFC-friendly email regex
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setInvalid($el, 'Email address is required.');
      return false;
    }
    if (!emailRe.test(val)) {
      setInvalid($el, 'Please enter a valid email address.');
      return false;
    }
    setValid($el);
    return true;
  }

  function validateSubject($el) {
    const val = $el.val().trim();
    if (!val) {
      setInvalid($el, 'Subject is required.');
      return false;
    }
    setValid($el);
    return true;
  }

  function validateMessage($el) {
    const val = $el.val().trim();
    if (!val) {
      setInvalid($el, 'Message is required.');
      return false;
    }
    if (val.length < 10) {
      setInvalid($el, 'Message should be at least 10 characters.');
      return false;
    }
    setValid($el);
    return true;
  }

  /* ── Live validation (on blur / change for better UX) ────────── */

  $(document).on('blur', '#contact-name',    function () { validateName($(this)); });
  $(document).on('blur', '#contact-email',   function () { validateEmail($(this)); });
  $(document).on('blur', '#contact-subject', function () { validateSubject($(this)); });
  $(document).on('blur', '#contact-message', function () { validateMessage($(this)); });

  /* ════════════════════════════════════════════════════════════════
     FORM SUBMIT
  ════════════════════════════════════════════════════════════════ */

  $('#contact-form').on('submit', function (e) {
    e.preventDefault();

    const $name    = $('#contact-name');
    const $email   = $('#contact-email');
    const $subject = $('#contact-subject');
    const $message = $('#contact-message');

    // Validate all fields — collect results (don't short-circuit)
    const ok = [
      validateName($name),
      validateEmail($email),
      validateSubject($subject),
      validateMessage($message)
    ].every(Boolean);

    if (!ok) return;

    /* ── Populate confirmation modal ───────────────────────────── */
    // Build an HTML summary of what the user typed to show in the modal
    const detailsHTML = `
      <dl class="row mb-0" style="font-size:.9rem;">
        <dt class="col-sm-3 confirm-label">Name</dt>
        <dd class="col-sm-9 confirm-detail">${$name.val().trim()}</dd>

        <dt class="col-sm-3 confirm-label">Email</dt>
        <dd class="col-sm-9 confirm-detail">${$email.val().trim()}</dd>

        <dt class="col-sm-3 confirm-label">Subject</dt>
        <dd class="col-sm-9 confirm-detail">${$subject.val().trim()}</dd>

        <dt class="col-sm-3 confirm-label">Message</dt>
        <dd class="col-sm-9 confirm-detail" style="white-space:pre-wrap;">${$message.val().trim()}</dd>
      </dl>
    `;

    $('#modal-details').html(detailsHTML);

    // Show Bootstrap modal
    const modalEl = document.querySelector('#confirmModal');
    const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  });

  /* ── Reset form when modal is fully hidden ───────────────────── */
  $(document).on('hidden.bs.modal', '#confirmModal', function () {
    $('#contact-form')[0].reset();
    clearValidation();
  });

});