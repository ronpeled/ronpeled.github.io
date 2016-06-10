
// Micro optimization, if you use literal objects when creating big structures
// you can save a few miliseconds, check JSPerf literal object vs function constructors
Trie = function () {
    this.words = 0;
    this.prefixes = 0;

    // It should be a literal object, you're doing a map not an array since your keys
    // are not numbers >= 0
    //this.children = [];
    this.children = {};
    // But if you're aiming on newer browser you could use `new Map()`, it might be
    // a bit heavier, but it is natively iterable, and your performance drop won't be
    // that bad since you're already using for-in to iterate this object
    // Also the Map will allow you to easierly do non-blocking iteration.
};

Trie.prototype = {

    insert: function(str, pos) {
        if (str.length == 0) {
            return;
        }

        // There is a micro gain on using scope instead context, however
        // your minifier will do it for you, and only if you call it multiple
        // times in your function
        var T = this;
        var k;
        var child;

        // One less comparison, but need the pos when initialize it to not die on
        // if (pos === undefined) {
        //     pos = 0;
        // }

        // undefined and 0 are equals when not strict comparison ;)
        if (pos == str.length) {
            T.words++;
            return;
        }

        T.prefixes++;

        k = str[pos];
        if (T.children[k] == undefined) {
            T.children[k] = new Trie();
        }

        child = this.children[k];
        child.insert(str, pos + 1);
    },

    // You can add a limit here, to not iterate more then you need.
    // You can cache the result array in another map, that doesn't iterate since the
    // user will add and remove letters, so you're repeating this operation many times
    // when the letters are removed
    getAllWords: function(str) {
        
        var T = this;
        var k;
        var child;
        var words = [];

        if (str == undefined) {
            str = "";
        }

        // You don't need to check if the context is invalid, if the developer
        // call this method without a context, it should throw an error, so add the
        // 'use strict'; would be better
        // if (this == undefined) {
        //     return [];
        // }

        if (T.words > 0) {
            words.push(str);
        }

        for (k in T.children) {
            child = T.children[k];
            words = words.concat(child.getAllWords(str + k));
        }

        return words;
    },

    prefix: function(str) {
        if (str.length == 0) {
            return this;
        }

        var k = str[0];

        if (this.children[k] != undefined) {
            return this.children[k].prefix(str.substring(1));
        }
    },

    autosuggest: function(str) {
        if (str.length == 0) return [];

        // var T = this;
        var child = this.prefix(str);

        if (child == undefined) return [];

        return child.getAllWords(str);
    },

    countNodes: function() {

        var T = this;
        var k;
        var child;
        var total = 0;

        // if (T == undefined) {
        //     return 0;
        // }

        for (k in T.children) {
            child = T.children[k];
            total += 1 + child.countNodes();
        }

        return total;

    }
};

// This inject a complexity we don't need
// var trieAutosuggest = function(myTrie) {
//     return function findMatches(q, cb) {

//         var matches = myTrie.autosuggest(q);
//         $('#matches-count').text(matches.length);
//         $('#matches-count').css('background-color', 'yellow');

//         cb(matches);
//     };
// };


// Potentially help speed up page load, but a copy is already passed to the typeahead function

function processItems(items, processItem){

    // Caching the length is a micro optimization
    var length = items.length;
    var index = 0;
    var avgSize = 0;

    // Don't copy the array again...
    //var queue = items.slice(0)

    // console.time('processItems ' + length);

    // IIFE
    (function processNextBatch() {
        var maxBlockingTime = Date.now();
        while (index < length) {

            // this operation is so heavy that I had no patience to wait it finish to know how 
            // long it would take. lol :)
            // nextItem = queue.shift()

            processItem(items[index]);
            index++;

            // Date.now() is heavier then math operations, from 2633~2842 to 2096~1795ms
            if (avgSize && index % avgSize == 0) {
                break;
            } else if (maxBlockingTime + 100 < Date.now()) {
                avgSize = index;
                break;
            }
        }
        if (index == length) {
            // console.timeEnd('processItems ' + length);
            return;
        };

        // You don't need to wait for 10ms, if you have 0, the operation will be moved to the
        // end of the JavaScript event loop, witch means that any user action or animation will 
        // be executed and this won't be a blocking operation
        setTimeout(processNextBatch, 0);
    }());
}

$.when($.ready, $.getScript('english-words.js')).then(function() {

    // Don't need to be out of the scope
    var englishTrie = new Trie();

    processItems(allEnglishWords, function (word) {
        // we love performance, so the pos is required to allow us remove a comparison
        // and gain some cycles ;)
        englishTrie.insert(word, 0);
    });

    $('.typeahead').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            name: 'states',
            limit: 15,

            // If you apply the limit in your trieAutosuggest to at least stop the nodes 
            // it also will became faster, but you will lose the nodes counter precision
            source: function findMatches(q, cb) {

                var matches = englishTrie.autosuggest(q);
                $('#matches-count').text(matches.length);
                $('#matches-count').css('background-color', 'yellow');

                cb(matches);
            }
        });

    $('#list-size').html(allEnglishWords.length);
    $('#trie-node-size').html(englishTrie.countNodes());

});
