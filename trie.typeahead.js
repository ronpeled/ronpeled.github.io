let worker = new Worker('worker.js');
    
worker.postMessage({
    command: 'load',
    value: 'english-words.js'
});

worker.onmessage = (event) => {
    let action = event.data;
    actions[action.command](action.value);
}


let promises = {
    size: $.Deferred(),
    nodesLength: $.Deferred()
}

let query = {
    cache: {},
    callQueue: [],
    execute(q, cb, asyncCb) {
        let cache = this.cache[q];
        if (cache) {
            cb(cache);
        } else {
            worker.postMessage({
                command: 'autosuggest',
                value: q
            });
            this.callQueue.push(asyncCb);
        }       
    }
};

let actions = {
    listSize(length) {
        promises.size.resolve(length);
        promises.size = promises.size.promise();
    },

    nodesLength(length) {
        promises.nodesLength.resolve(length);
        promises.nodesLength = promises.nodesLength.promise();
    },

    matches(data) {
        $(() => {
            $('#matches-count').text(data.list.length);
            $('#matches-count').css('background-color', 'yellow');
        });
        let asyncCb = query.callQueue.shift();
        if (query.callQueue.length == 0) {
            asyncCb(data.list);
        }
        query.cache[data.query] = data.list;
    }
}

$(() => {

    promises.size.then((length) => {
        $('#list-size').html(length);
    });

    promises.nodesLength.then((length) => {
        $('#trie-node-size').html(length);
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
            source: query.execute.bind(query)
        });
});
