var fs = require('fs'),
    system = require('system');
var page = require('webpage').create();
var webserver = require("webserver").create();

function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

if (phantom.args.length < 2) {
    console.log('Usage: render.js file output');
    phantom.exit();
} else {
    phantom.onError = function(msg, trace) {
        var msg = "\nScript Error: "+msg+"\n";
        if (stack && stack.length) {
            msg += "       Stack:\n";
            stack.forEach(function(t) {
                msg += '         -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : '')+"\n";
            })
        }
        console.error(msg+"\n");
        phantom.exit();
    };

    var output_file = phantom.args[1];

    var pathArray = phantom.args[0].split("/");
    var slides_folder = "";
    for (i = 0; i < pathArray.length-1; i++) {
      slides_folder += pathArray[i];
      slides_folder += "/";
    }

    var port = getRandomInt(8000, 9000);

    console.log("Starting web server on port " + port)
    console.log("Slides folder: " + slides_folder);

    webserver.listen(port);
    webserver.registerDirectory('/', phantom.libraryPath + "/container");
    webserver.registerDirectory('/slides/', slides_folder);

    var slides_file = phantom.args[0].split('/').pop()
    var container = 'http://localhost:' + port + "/index.html",
        slides_url = "slides/" + slides_file;

    console.log("Container address: " + container);
    console.log("Slides url: " + slides_url);

    var pages = 0,
        done = [];

    var finished_loading = function() {
        return page.evaluate(function() {
                return $('#loading:visible').size() == 0;
            });
    };

    var all_done = function() {
        var alldone = true;

        for (i in done) {
          alldone = alldone && done[i];
        }

        return alldone;
    }

    var process_page = function(i) {
        if (i == pages) {
            console.log("All slides rendered" );
            return;
        }

        var slide = page.evaluate(function () {
            return extract();
        });


        console.log("Processing slide " + i);

        fs.write(output_file, JSON.stringify(slide) + "\n", 'a+');

        // advance to the next page
        page.evaluate(function () {
            goNext();
        });

        done[i] = true;

        waitFor(finished_loading, function() {
            process_page(i+1);
        });
    };

    page.open(container + "?file=" + slides_url)
        .then(function(status) {
        if(status != 'success') {
            console.log('Unable to load the address!');
        } else {
            waitFor(finished_loading, function() {
                pages = page.evaluate(function () {
                    return pdfDoc.numPages;
                });

                console.log("Total slides: " + pages );

                for (var i=0;i<pages;i++) {
                    done[i] = false;
                }

                process_page(0);

                waitFor(all_done, function () {
                    console.log("All slides finished" );
                    phantom.exit();
                });
            });
        }
    });
}

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 1000000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout" );
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100); //< repeat check every 250ms
};
