//  HEADER EMAIL

$(document).ready(function () {
  var $form = $('#mc-embedded-subscribe-form')
  if ($form.length > 0) {
    $('form input[type="submit"]').bind('click', function (event) {
      if (event) event.preventDefault()
      register($form)
    })
  }
})

function register($form) {
  $('#mc-embedded-subscribe').val('Sending...');

  // Changed the dataType from json to jsonp
  $.ajax({
    type: $form.attr('method'),
    url: $form.attr('action'),
    data: $form.serialize(),
    cache: false,
    dataType: 'jsonp',
    contentType: 'application/json; charset=utf-8',
    error: function (err) {
      alert('Could not connect to the registration server. Please try again later.')
    },
    success: function (data) {
      $('#mc-embedded-subscribe').val('Get Early Access')
      if (data.result === 'success') {
        // Yeahhhh Success
        console.log("SUCCESS EMAIL HAS BEEN SUBSCRIBED!!")
        console.log(data.msg)
        $('#mailchimp-email').css('borderColor', '#69dbf5')
        $('#form-message').css('color', '#69dbf5')
        $('#form-message').html('Thank you for subscribing. We have sent you a confirmation email.')
        $('#mailchimp-email').val('')
      } else {
        // Something went wrong, do something to notify the user.
        console.log(data.msg)
        $('#mailchimp-email').css('borderColor', '#ff8976')
        $('#form-message').css('color', '#ff8976')
        $('#form-message').html(data.msg)
      }
    }
  })
};

// FOOTER EMAIL
$(document).ready(function () {
  var $form = $('#mc-embedded-subscribe-form-footer')
  if ($form.length > 0) {
    $('form input[type="submit"]').bind('click', function (event) {
      if (event) event.preventDefault()
      register($form)
    })
  }
})

function register($form) {
  $('#mc-embedded-subscribe-footer').val('Sending...');

  // Changed the dataType from json to jsonp
  $.ajax({
    type: $form.attr('method'),
    url: $form.attr('action'),
    data: $form.serialize(),
    cache: false,
    dataType: 'jsonp',
    contentType: 'application/json; charset=utf-8',
    error: function (err) {
      alert('Could not connect to the registration server. Please try again later.')
    },
    success: function (data) {
      $('#mc-embedded-subscribe-footer').val('Get Early Access')
      if (data.result === 'success') {
        // Yeahhhh Success
        console.log("SUCCESS EMAIL HAS BEEN SUBSCRIBED!!")
        console.log(data.msg)
        $('#mailchimp-email-footer').css('borderColor', '#69dbf5')
        $('#form-message-footer').css('color', '#69dbf5')
        $('#form-message-footer').html('Thank you for subscribing. We have sent you a confirmation email.')
        $('#mailchimp-email-footer').val('')
      } else {
        // Something went wrong, do something to notify the user.
        console.log(data.msg)
        $('#mailchimp-email-footer').css('borderColor', '#ff8976')
        $('#form-message-footer').css('color', '#ff8976')
        $('#form-message-footer').html(data.msg)
      }
    }
  })
};
