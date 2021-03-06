# Rotex HPSU configuration

Some notes about the CAN bus communication of the HPSU.

*Any information is provided by best knowledge but without any warranty.*

## Message data IDs

`buffer[2]` is the ID.  
If `buffer[2]` is `0xFA`, then the ID is in `buffer[3]` and `buffer[4]`.

## Message receiver IDs

`buffer[0]` and `buffer[1]` represent the receiver can ID.

If `buffer[1]` is `0x79` it's a broadcast message.

Examples:

`31 00 FA 01 D6 00 00`  
CAN-ID = `(0x31 & 0xF0) * 8 + (0x00 & 0x0F)` in hex = `0x180`

`20 0A 04 00 00`  
CAN-ID = `(0x20 & 0xF0) * 8 + (0x0A & 0x0F)` in hex = `0x10A`

The CAN-ID for sending a message may be the receiver ID + `0x010`.  
So if the receiver ID is `0x10A` the sender ID will be `0x11A`.

### Request / Response / Set

Message is request if `(buffer[0] & 0x0F) === 0x01`.

Message is response (current value) if `(buffer[0] & 0x0F) === 0x02`.

Message is a set command if `(buffer[0] & 0x0F) === 0x00`.

Request data from `0x10A`:  
`((0x10A / 8) & 0xf0) + 0x01` = `21`  
`(0x10A & 0x0F)` = `0A`  
Request data starts with `21 0A`.

## Known IDs

| Device | CAN-ID | Request from | Response to | Set |
|---|---|---|---|---|
| RoCon | `0x10A` | `21 0A` | `22 0A` | `20 0A` |
| Main | `0x180` | `31 00` | `32 00` | `30 00` (?) |
| Boiler | `0x300` | `61 00` | `62 00` | `60 00` |
| ??? | `0x500` | `A1 00` | `A2 00` | `A0 00` (?) |
