import React, { useEffect, useState } from 'react';
import Room from 'ipfs-pubsub-room';
import IPFS from 'ipfs';
import faker from 'faker';

import './App.css';

const USER = {
  name: faker.name.findName(),
  color: faker.commerce.color(),
};

const DEFAULT_ROOM = 'General';

interface User {
  name: string;
  color: string;
}

enum ActionType {
  Join = 'join',
  ConfirmJoin = 'confirm-join',
  Message = 'message',
}

interface Action {
  type: ActionType;
  payload: any;
}

const App: React.FC = () => {
  const [id, setId] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [roomName, setRoomName] = useState(DEFAULT_ROOM);
  const [users, setUsers] = useState<{ [id: string]: User }>({});
  const [value, setValue] = useState(faker.lorem.sentence());
  const [messages, setMessages] = useState<
    {
      user: User;
      message: string;
    }[]
  >([]);

  useEffect(() => {
    document.title = 'DChat';

    const ipfs = new IPFS({
      EXPERIMENTAL: {
        pubsub: true,
      },
      config: {
        Addresses: {
          Swarm: [
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
          ],
        },
      },
    });

    ipfs.on('ready', async () => {
      const nodeInfo = await ipfs.id();
      const id = nodeInfo.id;
      setId(id);

      const room = Room(ipfs, roomName);
      setRoom(room);

      room.on('peer joined', peer => {
        console.log('Peer joined the room', peer);

        // Hey! everyone, someone just joined, who is that?
        // btw, I am joined too
        // The problem we are trying to solve is that who owns this peer ID?
        // The approach is kind of like TCP handshake, I need other users
        // to confirm that I have actually joined the room and then
        // I can tell everyone who I am
        room.broadcast(
          JSON.stringify({
            payload: {
              newPeerId: peer,
              otherUser: { [id]: USER },
            },
            type: ActionType.Join,
          }),
        );
      });

      room.on('peer left', peer => {
        console.log('Peer left...', peer);
        setUsers(users => {
          const newUsers = { ...users };
          delete newUsers[peer];
          return newUsers;
        });
      });

      room.on('subscribed', () => {
        console.log('Connected room:', roomName);
        setUsers({
          [id]: USER,
        });
      });

      room.on('message', message => {
        const action = JSON.parse(message.data);
        const { type, payload } = action;
        switch (type) {
          case ActionType.Join:
            // Someone is asking who has joined? It seems like it is me.
            // Let me tell everyone my identity
            if (payload.newPeerId === id) {
              room.broadcast(
                JSON.stringify({
                  payload: { id, user: USER },
                  type: ActionType.ConfirmJoin,
                }),
              );

              // They also told me currently joined users
              setUsers(users => ({ ...users, ...payload.otherUser }));
            }
            break;

          // Someone is confirming join and telling us identity
          case ActionType.ConfirmJoin:
            setUsers(users => ({ ...users, [payload.id]: payload.user }));
            break;

          case ActionType.Message:
            setMessages(messages => [payload, ...messages]);
            break;
        }
      });
    });

    return () => {
      (async () => {
        if (!room) return;
        await room.leave();
      })();
    };
  }, [roomName]);

  if (room) {
    console.log('me', id);
    console.log('peers', room.getPeers());
  }

  return (
    <main className="container">
      <section className="rooms">
        <h2>ROOMS</h2>
        <ul>
          {[DEFAULT_ROOM, 'Fun'].map(roomName => (
            <li
              key={roomName}
              onClick={() => {
                setRoomName(roomName);
              }}
            >
              {roomName}
            </li>
          ))}
        </ul>
      </section>
      <section className="users">
        <h2>USERS</h2>
        <ul>
          {Object.entries(users).map(([id, { name, color }]) => (
            <li key={id} style={{ backgroundColor: color }}>
              {name}
            </li>
          ))}
        </ul>
      </section>
      <section className="chat">
        <h1>DChat</h1>
        <p>A decentralized chat app built with React and Blockchain</p>
        {/* We cannot start chatting until someone is confirmed that we have joined the room (users are not just me) */}
        {Object.keys(users).length > 1 ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!value || !room) return;
              room.broadcast(
                JSON.stringify({
                  type: ActionType.Message,
                  payload: {
                    user: USER,
                    message: value,
                  },
                }),
              );
              setValue(faker.lorem.sentence());
            }}
          >
            <input
              className="input"
              value={value}
              onChange={e => {
                setValue(e.currentTarget.value);
              }}
            />
            <button type="submit">SEND</button>
            <ul>
              {messages.map(({ user: { name, color }, message }, i) => (
                <li key={i} className="message">
                  <span
                    style={{
                      backgroundColor: color,
                    }}
                  >
                    {name}
                  </span>
                  : <span>{message}</span>
                </li>
              ))}
            </ul>
          </form>
        ) : (
          'It looks like you are the only one in the room'
        )}
      </section>
    </main>
  );
};

export default App;
