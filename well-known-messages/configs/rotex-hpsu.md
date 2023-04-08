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
| Boiler (after some change?) | `0x301` | `61 01` | `62 01` | `60 01` |
| ??? | `0x500` | `A1 00` | `A2 00` | `A0 00` (?) |

## Changelog

### latest

- Added `fa0129-set`, `fa012A-set`
- Added `fac0f6-set`
- Added `08-set`
- Added `fa0a00-set`
- Added `fa0691-set`
- Added `fac0f9-set`
- Added `fa0668-set`

### v1.6.0

- Added `fa0182-set`, `fa065e-set`, `680.fa065f-set`

### v1.5.0

- Added `180.fa0144`, `680.fa0144`, `680.fa0144-set`
- Added `680.fa010e-set`
- Added `180.fac105`, `180.fac106`

### v1.4.0

- Use DLC of 7 for all messages
- Added `180.fa1388`, `500.fafdac`, `500.61`, `680.fa1388`, `680.fa06d2-set`, `680.0f`, `680.fafd8c`, `680.61`, `600.0f`
