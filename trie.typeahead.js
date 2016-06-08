

Trie = function () {
    this.words = 0;
    this.prefixes = 0;
    this.children = [];
};

Trie.prototype = {

    insert: function(str, pos) {
        if (str.length == 0) {
            return;
        }

        var T = this;
        var k;
        var child;

        if (pos === undefined) {
            pos = 0;
        }

        if (pos === str.length) {
            T.words++;
            return;
        }

        T.prefixes ++;

        k = str[pos];
        if (T.children[k] === undefined) {
            T.children[k] = new Trie();
        }

        child = T.children[k];
        child.insert(str, pos+1);
    },

    getAllWords: function(str) {
        var T = this;
        var k;
        var child;
        var words = [];

        if (str === undefined) {
            str = "";
        }

        if (T == undefined) {
            return [];
        }

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
        if (str.length == 0 || str === undefined) {
            return this;
        }

        var T = this;
        var k = str[0];

        if (T.children[k] != undefined) {
            return T.children[k].prefix(str.substring(1));
        }
    },

    autosuggest: function(str) {

        if (str.length == 0 || str === undefined) {
            return [];
        }

        var T = this;
        var child = T.prefix(str);

        if (child === undefined) {
            return [];
        }


        return child.getAllWords(str);
    },

    countNodes: function() {

        var T = this;
        var k;
        var child;
        var total = 0;

        if (T == undefined) {
            return 0;
        }

        for (k in T.children) {
            child = T.children[k];
            total += 1 + child.countNodes();
        }

        return total;

    }
};

var englishTrie = new Trie();


var trieAutosuggest = function(myTrie) {
    return function findMatches(q, cb) {

        var matches = myTrie.autosuggest(q);
        $('#matches-count').text(matches.length);
        $('#matches-count').css('background-color', 'yellow');

        cb(matches);
    };
};


// Potentially help speed up page load, but a copy is already passed to the typeahead function

function processItems(items, processItem){

    // Caching the length is a micro optimization
    var length = items.length;
    var index = 0;

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

            // Date.now() is heavier then math operations, from 2633~2842 to 2553~2055ms
            if (index % 1e4 == 0 && maxBlockingTime + 100 <= Date.now()) {
                maxBlockingTime = Date.now();
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

    processItems(allEnglishWords, function (word) {
        englishTrie.insert(word);
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
            source: trieAutosuggest(englishTrie)
        });

    $('#list-size').html(allEnglishWords.length);
    $('#trie-node-size').html(englishTrie.countNodes());

});
