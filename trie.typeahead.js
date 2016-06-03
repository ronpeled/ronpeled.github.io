

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


var trieAutosuggest = function(myTrie) {
    return function findMatches(q, cb) {

        var matches = myTrie.autosuggest(q);

        cb(matches);
    };
};


var englishTrie = new Trie();
$.each(allEnglishWords, function (i, str) {
    englishTrie.insert(str.toLowerCase());
});

$('.typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'states',
        limit: 15,
        source: trieAutosuggest(englishTrie)
    });


$('#list-size').html(allEnglishWords.length);
$('#trie-node-size').html(englishTrie.countNodes());