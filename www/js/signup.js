/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 *
 */
$(document).ready(function () {
    $("#formRegister").on("submit", function (event) {
        event.preventDefault();
        $(".alert").slideUp("fast", function () {
            $(this).remove();
        });
        var email = $("#registerEMail").val(),
            username_ = $("#registerUsername").val(),
            password = $("#registerPassword").val(),
            passwordRepeated = $("#registerPasswordRepeated").val();
        if (!email || !(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(email)) {
            $('<div class="alert alert-danger" style="display: none;">Please give your email-address for logging in</div>')
                .insertBefore($("#registerEMail").parent())
                .slideDown("fast");
            return;
        }
        if (!username_ || username_.length < 5) {
            $('<div class="alert alert-danger" style="display: none;">Please enter a name</div>')
                .insertBefore($("#registerUsername").parent())
                .slideDown("fast");
            return;
        }
        if (!password || password.length < 5 || password.length > 20) {
            $('<div class="alert alert-danger" style="display: none;">Please enter a password between 5 and 20 characters long</div>')
                .insertBefore($("#registerPassword").parent())
                .slideDown("fast");
            return;
        }
        if (password !== passwordRepeated) {
            $('<div class="alert alert-danger" style="display: none;">Your repeated password does not match your chosen one</div>')
                .insertBefore($("#registerPasswordRepeated").parent())
                .slideDown("fast");
            return;
        }
        $("#btnRegister").button("loading");
        $.ajax({
            url: "/users/register",
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                username: username_,
                password: password,
                recaptcha_challenge_field: Recaptcha.get_challenge(),
                recaptcha_response_field: Recaptcha.get_response()
            }),
            success: function (data) {
                if (data.result === "success") {
                    $('<div class="alert alert-success" style="display: none;">Great, you are registered! A welcome e-mail has been sent to you (if necessary look for it in your spam folder). <b>To activate your account please follow the link provided in the e-mail.</b> If you do not follow that link in the next 3 days you will have to re-register.</div>')
                        .insertBefore($("#btnRegister").parent())
                        .slideDown("fast");
                    $("#formRegister")[0].reset();
                } else {
                    if (data.error === "recaptcha invalid") {
                        $('<div class="alert alert-danger" style="display: none;">The words you entered did not match those in the picture</div>')
                            .insertBefore($("#registerRecaptcha"))
                            .slideDown("fast");
                    } else if (data.error === "user exists") {
                        $('<div class="alert alert-danger" style="display: none;">A user with that email-address already exists</div>')
                            .insertBefore($("#registerEMail").parent())
                            .slideDown("fast");
                    } else {
                        $('<div class="alert alert-danger" style="display: none;">An error occured: ' + data.error + '</div>')
                            .insertBefore($("#btnRegister").parent())
                            .slideDown("fast");
                    }
                    Recaptcha.reload();
                }
                $("#btnRegister")
                    .removeClass("btn-danger")
                    .button("reset");
            },
            error: function () {
                $("#btnRegister")
                    .addClass("btn-danger")
                    .button("error");
                Recaptcha.reload();
            }
        });
    });

    $("#btnRegister").button("loading");
    $.ajax({
        type: "GET",
        url: "/users/recaptcha",
        success: function (data) {
            Recaptcha.create(data.recaptcha, "registerRecaptcha", {
                theme: "custom",
                custom_theme_widget: "registerRecaptcha",
                callback: function () {
                    $("#btnRegister").button("reset");
                }
            });
        }
    });

});
