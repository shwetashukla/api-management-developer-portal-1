import * as ClientOAuth2 from "client-oauth2";
import { MapiClient } from "./mapiClient";
import { AuthorizationServerContract } from "../contracts/authorizationServer";
import { AuthorizationServer } from "./../models/authorizationServer";
import { PageContract } from "../contracts/page";

export class OAuthService {
    constructor(private readonly mapiClient: MapiClient) {
    }

    public async getOAuthServers(): Promise<AuthorizationServer[]> {
        try {
            const pageOfOAuthservers = await this.mapiClient.get<PageContract<AuthorizationServerContract>>("/authorizationServers");
            return pageOfOAuthservers.value.map(x => new AuthorizationServer(x));
        }
        catch (error) {
            debugger;
        }
    }

    public async authenticateImplicit(): Promise<void> {
        const clientId = "356699480563-70p2o8jft36npoa867oiqp3iq99mlrp9.apps.googleusercontent.com";
        const accessTokenUri = "https://oauth2.googleapis.com/token";
        const authorizationUri = "https://accounts.google.com/o/oauth2/auth";
        const redirectUri = "https://developer.apim.net/signin-oauth/implicit/callback";
        const scopes = ["profile"];

        const oauthClient = new ClientOAuth2({
            clientId: clientId,
            accessTokenUri: accessTokenUri,
            authorizationUri: authorizationUri,
            redirectUri: redirectUri,
            scopes: scopes
        });

        window.open(oauthClient.token.getUri(), "_blank", "width=400,height=500");

        const receiveMessage = async (event: MessageEvent) => {
            const uri = event.data["uri"];
            const user = await oauthClient.token.getToken(uri);

            console.log(user.accessToken);
        };

        window.addEventListener("message", receiveMessage, false);
    }

    public async authenticateCode(): Promise<string> {
        const clientId = "";
        const accessTokenUri = "https://oauth2.googleapis.com/token";
        const authorizationUri = "https://accounts.google.com/o/oauth2/auth";
        // const redirectUri = "https://developer.apim.net/signin-oauth/code/callback";
        const redirectUri = "https://alzaslontests02.developer.preview.int-azure-api.net/signin-oauth/code/callback";
        const scopes = ["profile"];

        const oauthClient = new ClientOAuth2({
            clientId: clientId,
            accessTokenUri: accessTokenUri,
            authorizationUri: authorizationUri,
            redirectUri: redirectUri,
            scopes: scopes
        });

        return new Promise<string>((resolve, reject) => {
            window.open(oauthClient.code.getUri(), "_blank", "width=400,height=500");

            const receiveMessage = async (event: MessageEvent) => {
                const accessToken = event.data["accessToken"];
                const accessTokenType = event.data["accessTokenType"];
                console.log(accessToken);

                resolve(accessToken);
            };

            window.addEventListener("message", receiveMessage, false);
        });
    }
}

