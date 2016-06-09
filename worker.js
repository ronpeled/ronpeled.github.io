Trie = function () {
    this.words = 0;
    this.prefixes = 0;

    this.children = {};
};

Trie.prototype = {

    insert: function(str, pos) {
        if (str.length == 0) {
            return;
        }

        var T = this;
        var k;
        var child;

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

    getAllWords: function(str) {
        
        var T = this;
        var k;
        var child;
        var words = [];

        if (str == undefined) {
            str = "";
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

        var child = this.prefix(str);

        if (child == undefined) return [];

        return child.getAllWords(str);
    },

    countNodes: function() {

        var T = this;
        var k;
        var child;
        var total = 0;

        for (k in T.children) {
            child = T.children[k];
            total += 1 + child.countNodes();
        }

        return total;
    }
};


const englishTrie = new Trie();

let actions = {
    load(file) {
        let m;
        //console.time('load file');
        importScripts(file);

        m = allEnglishWords.length;
        postMessage({
           command: 'listSize',
           value: m
        });
        //console.timeEnd('load file');

        //console.time('parse data');
        for(let i = 0; i < m; i++) {
            englishTrie.insert(allEnglishWords[i], 0);
        }
        //console.timeEnd('parse data');

        postMessage({
           command: 'nodesLength',
           value: englishTrie.countNodes()
        });
    },
    autosuggest(q) {
        let matches = englishTrie.autosuggest(q);

        postMessage({
           command: 'matches',
           value: matches
        });
    }
}

onmessage = (event) => {
    let action = event.data;
    actions[action.command](action.value);
}