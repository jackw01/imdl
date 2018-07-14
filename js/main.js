/*
imdl
Copyright (C) 2018 jackw01
This program is distrubuted under the MIT License, see LICENSE for details
*/

var running = false;

function setProgress(progress) {
    $(".progress-bar").css("width", progress * ($(".progress-bar-track").width() - 2) + "px");
}

function zipAndSave(info, images) {

    var zip = new JSZip();
    var folder = zip.folder(info.id);
    folder.file("info.json", JSON.stringify(info, null, 4));

    var i = 0;

    function addFile() {

        setProgress(i / images.length / 2 + 0.5);
        folder.file(("0000" + i).slice(-4) + "-" + images[i].file,
                    images[i].data.split("base64,")[1],
                    { base64: true });
        i++;

        if (i == images.length - 1) {
            zip.generateAsync({ type: "blob", compression: "DEFLATE" }).then(function(content) {
                saveAs(content, info.id + ".zip");
                setProgress(1);
                running = false;
            });
        } else {
            setTimeout(addFile, 0);
        }
    }

    addFile();
}

$("#button-download").click(function() {

    if (!running) {

        running = true;

        var url = $("#input-url").val().trim();
        var result = /^(?:https:\/\/)?(?:www\.)?imgur\.com\/(?:a|gallery)\/([\w\d]{4,})/i.exec(url);

        if (result) {

            $.ajax({
                "async": true,
                "crossDomain": true,
                "url": "https://api.imgur.com/3/album/" + result[1],
                "method": "GET",
                "headers": {
                    "Authorization": "Client-ID 7ea43b92f3eeb0c"
                }
            }).done(function(response) {

                $("#error").fadeOut(150);

                var imgArray = [];
                var albumLength = response.data.images.length;
                var i = 0;

                function load() {

                    setProgress(i / albumLength / 2);

                    var im = response.data.images[i];
                    var xhttp = new XMLHttpRequest();

                    xhttp.onload = function() {

                        var fileReader = new FileReader();
                        fileReader.onload = function() {

                            imgArray.push({file: /^.*\/([\w\d]{4,}\.\w{3})$/i.exec(im.link)[1],
                                           data: fileReader.result,
                                           info: im});

                            if (imgArray.length === albumLength) {
                                zipAndSave(response.data, imgArray);
                            } else {
                                i++;
                                load();
                            }
                        }

                        fileReader.readAsDataURL(xhttp.response);
                    };

                    xhttp.responseType = "blob";
                    xhttp.open("GET", im.link, true);
                    xhttp.send();
                }

                $(".progress-bar-track").fadeIn(200);
                load();

            }).fail(function(response) {
                $("#error").fadeIn(150);
                running = false;
            });
        } else {
            $("#error").fadeIn(150);
            running = false;
        }
    }
});

// Run on page load
$(document).ready(function() {
    $("#error").hide();
});
