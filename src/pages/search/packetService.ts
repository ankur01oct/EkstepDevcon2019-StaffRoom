import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class PacketService {
  constructor(private httpService: HttpClient) {

  }

  setPacket(id) {
      console.log('inside set id, visitor id : ', id );
    return this.httpService.post(`https://glacial-chamber-45121.herokuapp.com/packet/${id}`, '').subscribe((data) => {
        return data;
    });
  }

  getPacket(req) {
      const request = {
        'visitorId': req.visitorId,
        'visitorName': req.visitorName
      };

    console.log('inside getPacket, request : ', request );
    return this.httpService.post('https://glacial-chamber-45121.herokuapp.com/classroom/start/1', request);
  }
  deletePacket() {
    return this.httpService.get('https://glacial-chamber-45121.herokuapp.com/classroom/end/1');
  }
}
