import * as ClientOAuth2 from "client-oauth2";
import { MapiClient } from "./mapiClient";
import { AuthorizationServerContract } from "../contracts/authorizationServer";
import { AuthorizationServer } from "../models/authorizationServer";
import { PageContract } from "../contracts/page";

export class OAuthService {
    constructor(private readonly mapiClient: MapiClient) { }

    public async getOAuthServers(): Promise<AuthorizationServer[]> {
        try {
            const pageOfAuthservers = await this.mapiClient.get<PageContract<AuthorizationServerContract>>("/authorizationServers");

            return pageOfAuthservers
                .value
                .map(authServer => new AuthorizationServer(authServer))
                .filter(authServer => authServer.grantTypes.includes("implicit")); // Temporarily filter out other flows
        }
        catch (error) {
            debugger;
        }
    }

    public authenticateImplicit(authorizationServer: AuthorizationServer): Promise<string> {
        const clientId = authorizationServer.clientId;
        const accessTokenUri = authorizationServer.tokenEndpoint;
        const authorizationUri = authorizationServer.authorizationEndpoint;
        // const redirectUri = `https://${location.hostname}/signin-oauth/implicit/callback`;
        const redirectUri = "https://developer.apim.net/signin-oauth/implicit/callback";
        const scopes = ["profile"];

        const oauthClient = new ClientOAuth2({
            clientId: clientId,
            accessTokenUri: accessTokenUri,
            authorizationUri: authorizationUri,
            redirectUri: redirectUri,
            scopes: scopes
        });

        return new Promise((resolve, reject) => {
            window.open(oauthClient.token.getUri(), "_blank", "width=400,height=500");

            const receiveMessage = async (event: MessageEvent) => {
                const uri = event.data["uri"];

                if (!uri) {
                    return;
                }

                const user = await oauthClient.token.getToken(uri);
                resolve(`${user.tokenType} ${user.accessToken}`);
            };

            window.addEventListener("message", receiveMessage, false);
        });
    }

    public async authenticateCode(authorizationServer: AuthorizationServer): Promise<string> {
        const clientId = authorizationServer.clientId;
        const accessTokenUri = authorizationServer.tokenEndpoint;
        const authorizationUri = authorizationServer.authorizationEndpoint;
        // const redirectUri = `https://${location.hostname}/signin-oauth/implicit/callback`;
        
        const redirectUri = "https://developer.apim.net/signin-oauth/code/callback";
        // const redirectUri = "https://alzaslontests02.developer.preview.int-azure-api.net/signin-oauth/code/callback";
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

