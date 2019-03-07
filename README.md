# code-berlin


Note: The bugs are only cause of orbit [not being compatible](https://github.com/orbitdb/orbit-db/issues/543) (yet) with ipfs's latest stable version which fixes all of them.  

Note: some of the output of the bash commands has been replaced with dots as it will vary instance to instance
and could be too big to be legible on the README.

## How to: Full node(one machine)

This how-to will explain how to setup a 3 full node system on **one machine**


1. Clone the respository and setup directories

     ```
     $ git clone https://github.com/R9295/code-berlin.git
     $ cd code-berlin/full
     $ mkdir node_a node_b node_c
     $ cp built/* -r node_a
     $ cp built/* -r node_b
     $ cp built/* -r node_c
    ```

2. Initialise the database. <br>
  OrbitDB doesn't support assigning permissions dynamically(for now, it's in [development](https://github.com/orbitdb/orbit-db/issues/292)), so once the database is initialized,
you cannot grant write access to any peers that weren't assigned at the start. The identifier that allows peers to write is the **hex value** of the **public key** of the orbitdb instance. So we'll have to generate our keys first, and then initialise a database. 

      ```
      $ pwd
      code-berlin/full
      $ cd node_a
      $ ./code-berlin-<yourOS> key
     # some additional output here...
     Your key is   045200d216ff70bc8417b6a24432f5f10aaced265..........................
    ```

    Copy the value, and do the same thing for ``node_b``. 
  We don't need to do this for ``node_c`` as it will be initialising the db, and the one 
  initializing automatically has write access.


3. Add the two keys in ``node_c``'s ``config.json``

    ```
    $ pwd
    code-berlin/full/node_c
    $ nano config.json
    {
      "bootstrapAddresses": [],
      "serverPort": 3003,
      "databaseAddress": "wiki",
      "allowedToWrite": ["node_a_key", "node_b_key"],
      "ipfsPort": 1544
    }
    ```

4. Start ``node_c``

    ```
    $ pwd
    code-berlin/full/node_c
    $ ./code-berlin-<yourOS> start
    Swarm listening on /ip4/127.0.0.1/tcp/1545/ws/ipfs/<hash>
    Swarm listening on /ip4/192.168.1.104/tcp/1545/ws/ipfs/<hash>
    Swarm listening on /ip4/127.0.0.1/tcp/1544/ipfs/<hash>
    Swarm listening on /dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star/ipfs/<hash>
    Your IPFS id: ....
    Your orbitdb address: /orbitdb/...../wiki
    Your db public key(hex): .....
    The app is running on http://0.0.0.0:3003
    ```


    Voila! You can now go the the [interface](http://0.0.0.0:3003). Feel free to add some content before moving forward.

4. Connect ``node_a`` and ``node_b``'s ipfs and orbitdb instance to ``node_``'s
The two easiest ways for this are through a signal server or through the websocket listener of ``node_c``.
Let's go with the websocket option because we have to use this in the ``lite`` version(because of a [bug](https://github.com/ipfs/js-ipfs/issues/1699) in the browser version of IPFS), so it's better to be consistent.

    ```
    # start the instance if it's not running
    $ pwd
    code-berlin/full/node-c
    $ ./code-berlin-<yourOS> start
    
    # copy this address as it's the listener on localhost with websockets
    Swarm listening on /ip4/127.0.0.1/tcp/1545/ws/ipfs/<hash>
    Swarm listening on /ip4/192.168.1.104/tcp/1545/ws/ipfs/<hash>
    # this listener is also on localhost, but no ws(websockets)!
    Swarm listening on /ip4/127.0.0.1/tcp/1544/ipfs/<hash>
    Swarm listening on /dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star/ipfs/<hash>
    Your IPFS id: ....
    
    # copy the orbit_db address 
    Your orbitdb address: /orbitdb/...../wiki
    Your db public key(hex): .....
    The app is running on http://0.0.0.0:3003
    ```
    Make sure you have the swarm address with ``/ws/`` on it.


5. Add the copied addresses to ``node_a`` and ``node_b``'s ``config.json``

    ```
    $ pwd 
    code-berlin/full/node-a
    $ nano config.json
    {
    "bootstrapAddresses": [
      "ipfs websocket listener address that you copied"
    ],
      "serverPort": 3003,
      "databaseAddress": "orbitdb address that you copied",
      "allowedToWrite": [],
      "ipfsPort": 1544
    }
    # repeat for node_b
    ```
**That should be it!** Start ``node_c`` if it's off, and then start ``node_a`` and ``node_b``. If you've added content before 
``node_a`` and ``node_b`` booted, you should see this message in your terminal: ``Synced with new data!``.
Congratulations! You have successfully set-up the nodes. Try adding content on different nodes and watch them sync P2P!


## How to: Full node(each node has an individual machine)
Very similar process when each folder is swapped for a different machine, only one small change to implement:
When you have to copy the swarm and db addresses on step 5, instead of copying the localhost listener of ``node_c``, copy the websocket listener with the **local address**.
```
# start the instance if it's not running
$ ./code-berlin-<yourOS> start


Swarm listening on /ip4/127.0.0.1/tcp/1545/ws/ipfs/<hash>
# copy this address as it's the websocket listener with the local address 
Swarm listening on /ip4/192.168.1.104/tcp/1545/ws/ipfs/<hash>
Swarm listening on /ip4/127.0.0.1/tcp/1544/ipfs/<hash>
Swarm listening on /dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star/ipfs/<hash>
Your IPFS id: ....

# copy the orbit_db address 
Your orbitdb address: /orbitdb/...../wiki
Your db public key(hex): .....
The app is running on http://0.0.0.0:3003
```


## How to: Lite node(one machine)
This how-to will explain how to setup a lite node and connect it to a full node that's running on **the same machine**

1. Setup atleast one full node, and start it; let's keep ``node_c`` from the how-to above.  
    ```
    $ pwd
    code-berlin/full/node_c
    
    $ ./code-berlin-<yourOS> start
    # copy this address as it's the listener on localhost with websockets
    Swarm listening on /ip4/127.0.0.1/tcp/1545/ws/ipfs/<hash>
    Swarm listening on /ip4/192.168.1.104/tcp/1545/ws/ipfs/<hash>
    Swarm listening on /ip4/127.0.0.1/tcp/1544/ipfs/<hash>
    Swarm listening on /dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star/ipfs/<hash>
    Your IPFS id: ....

    # copy the orbit_db address 
    Your orbitdb address: /orbitdb/...../wiki
    Your db public key(hex): .....
    The app is running on http://0.0.0.0:3003
    ```

2. Setup the lite node
    ```
    $ pwd
    code-berlin/lite
    $ mkdir lite_a
    $ cp built/* -r lite_a/
    $ cd lite_a
    $ nano config.json
    {
     "bootstrapAddresses": [
      "ipfs websocket listener address that you copied"
    ],
      "serverPort": 3001,
      "databaseAddress": "orbitdb address that you copied",
    }
    ```
3. Run the lite node
    ```
    $ pwd
    code-berlin/lite/lite_a
    $ ./code-berlin-lite 
    listening on 0.0.0.0:3001
    ```
    This should automatically open your browser and direct you to the interface. Wait for a bit, and you should get a message
    asking you to refresh the page cause your database has been synced! Enjoy IPFS and OrbitDB in the browser!


## How to: Lite node(each node is on a different machine)
Change the localhost listener of ``node_c`` to the one with the local address and edit ``lite_a``'s config.json  
