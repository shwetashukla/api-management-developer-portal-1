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

    public async authenticate(grantType: string, authorizationServer: AuthorizationServer): Promise<string> {
        let accessToken;

        switch (grantType) {
            case "implicit":
                accessToken = await this.authenticateImplicit(authorizationServer);
                break;
                
            case "authorizationCode":
                accessToken = await this.authenticateCode(authorizationServer);
                break;

            case "clientCredentials":
                accessToken = await this.authenticateClientCredentials();
                break;

            default:
                throw new Error(`Unsupported grant type: ${grantType}`);
        }

        return accessToken;
    }

    public authenticateImplicit(authorizationServer: AuthorizationServer): Promise<string> {
        const scopes = ["profile"];

        const oauthClient = new ClientOAuth2({
            clientId: authorizationServer.clientId,
            accessTokenUri: authorizationServer.tokenEndpoint,
            authorizationUri: authorizationServer.authorizationEndpoint,
            redirectUri: `https://${location.hostname}/signin-oauth/implicit/callback`,
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
        const redirectUri = `https://${location.hostname}/signin-oauth/implicit/callback`;
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
                if (!event.data["accessToken"]) {
                    return;
                }

                const accessToken = event.data["accessToken"];
                const accessTokenType = event.data["accessTokenType"];
                resolve(`${accessTokenType} ${accessToken}`);
            };

            window.addEventListener("message", receiveMessage, false);
        });
    }

    public async authenticateClientCredentials(): Promise<string> {
        const uri = `https://${location.hostname}/signin-oauth/credentials`;

        return new Promise<string>((resolve, reject) => {
            window.open(uri, "_blank", "width=400,height=500");

            const receiveMessage = async (event: MessageEvent) => {
                if (!event.data["accessToken"]) {
                    return;
                }

                const accessToken = event.data["accessToken"];
                const accessTokenType = event.data["accessTokenType"];
                resolve(`${accessTokenType} ${accessToken}`);
            };

            window.addEventListener("message", receiveMessage, false);
        });
    }
}

