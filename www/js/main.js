/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 *
 */
$(document).ready(function() {
    $(".helpbutton")
        .click(function() { return false; })
        .popover({
            html: true
        });
    $(".with-tooltip-home").tooltip({
        container: "body"
    });

    $("#formLogin").on("submit", function(event) {
        event.preventDefault();
        var email_ = $("#sign_in_email").val(),
            password = $("#sign_in_password").val();
        $("#formLogin button")
            .removeClass("btn-danger")
            .button("loading");
        $.ajax({
            url: "/users/session",
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify({
                email: email_,
                password: password
            }),
            success: function(data) {
                $("#formLogin button").button("reset");
                if (data.result==="success") {
                    window.location.reload();
                } else {
                    $("#formLogin button")
                        .addClass("btn-danger")
                        .button("error");
                }
            },
            error: function() {
                $("#formLogin button")
                    .addClass("btn-danger")
                    .button("error");
            }
        });
    });
});
