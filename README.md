# DChat

A decentralized chat app built with React and Blockchain

## Playground

CID: QmQFGEypxe7Fb3vuEGw1bNiowcji2Jn7g99TA7iEWHoJqU

Link: https://ipfs.io/ipfs/QmQFGEypxe7Fb3vuEGw1bNiowcji2Jn7g99TA7iEWHoJqU

## Development

```
yarn install

yarn start
```

## Technologies

- React
- IPFS
- P2P Network

## Features to Experiment

- [ ] 1-on-1 messaging
- [ ] Group channels
- [x] Open channels
- [ ] Typing indicators
- [ ] Send and receive structured media
- [ ] Chat history
- [ ] Invitations
- [ ] Read receipts
- [ ] User precense
- [ ] User-to-user blocking

## Challenges

### How to associate CID with user identity?

Similar to TCP 3-way handshake, I need other users to confirm that I have successfully joined the room first via `peer joined` event,
then other users will broadcast this peer CID. If it is my CID, that means I have successfully joined.
Now, I can broadcast my identity to everyone in the room
