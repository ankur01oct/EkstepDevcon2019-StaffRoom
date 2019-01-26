import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class VisitorService {
  constructor(private http: HttpClient) { }
getVisitorData(id) {
    const req = {
        'request': {
          'code': id
        }
  };

return this.http.post<Visitor>(`https://dev.ekstep.in/api/devcon/v3/login`, req);
}
}

interface Visitor {
    id: string;
    ver: string;
    ets: string;
    params: {
        resmsgid: string,
        msgid: string,
        err: string,
        status: string,
        errmsg: string
    };
    responseCode: string;
    result: {
        Visitor: {
            code: string,
            coinsGiven: any,
            name: string,
            osid: string
        }
    };
}


