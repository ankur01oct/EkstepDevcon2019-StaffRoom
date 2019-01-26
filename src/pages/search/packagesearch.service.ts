import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';


@Injectable()
export class PackageSearchService {
    constructor (private httpService: HttpClient) { }
    packageSearch (id) {
        const req =  {
            request : { 'filters': {
                    'objectType': 'Content',
                  'mimeType': 'application/vnd.ekstep.content-collection',
                    'identifier' : id,
                    'status': ['Live']
                },
                'sort_by': {'lastUpdatedOn': 'desc'}
            }
        };
        console.log('in package search', req);
        const config = { headers: new HttpHeaders().set('x-Channel-Id', 'devcon.appu') };
      return this.httpService.post<Sidebar>('https://dev.ekstep.in/api/search/v3/search', req, config);
    }
}
interface Sidebar {

    id: string ;
    ver: string;
    ts: string;
    params: {
        resmsgid: string,
        msgid: string,
        err: string,
        status: string,
        errmsg: string
    };
    responseCode: string;
    result: {
        count: any,
        content: any
    };

}


