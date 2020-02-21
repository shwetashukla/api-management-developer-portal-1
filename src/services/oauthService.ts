import { HttpClient } from "@paperbits/common/http";
import * as ClientOAuth2 from "client-oauth2";

import { OAuth2PopupFlow } from "oauth2-popup-flow";

export class OAuthService {
    constructor(private readonly httpClient: HttpClient) {

    }

    public async signIn(): Promise<void> {
        // const githubAuth = new ClientOAuth2({
        //     clientId: "754ec8dabea9c0b296d2",
        //     accessTokenUri: "https://github.com/login/oauth/access_token",
        //     authorizationUri: "https://github.com/login/oauth/authorize",
        //     redirectUri: "https://published.apim.net/api-details/",
        //     scopes: ["notifications", "gist"]
        // });

        // debugger;



        // // Open the page in a new window, then redirect back to a page that calls our global `oauth2Callback` function.
        // window.open(githubAuth.token.getUri()); // , "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400");

        interface TokenPayload {
            exp: number;
            other: string;
            stuff: string;
            username: string;
          }


        const auth = new OAuth2PopupFlow<TokenPayload>({
            authorizationUri: "https://github.com/login/oauth/authorize",
            clientId: "754ec8dabea9c0b296d2",
            redirectUri: "https://published.apim.net/api-details/",
            scope: "openid profile",
          });

        // if the user is already logged in, it won't open the popup
        auth.tryLoginPopup().then(result => {
            if (result === "ALREADY_LOGGED_IN") {
                debugger;
            } else if (result === "POPUP_FAILED") {
                debugger;
            } else if (result === "SUCCESS") {
                debugger;
            }
        });
    }
}


console.log("AAAA");