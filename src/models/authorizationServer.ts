import { AuthorizationServerContract } from "./../contracts/authorizationServer";

export class AuthorizationServer {
    public readonly id: string;
    public readonly displayName: string;
    public readonly clientId: string;
    public readonly authorizationEndpoint: string;
    public readonly tokenEndpoint: string;
    public readonly grantTypes: string[];

    constructor(contract: AuthorizationServerContract) {
        this.id = contract.name;
        this.displayName = contract.properties.displayName;
        this.clientId = contract.properties.clientId;
        this.authorizationEndpoint = contract.properties.authorizationEndpoint;
        this.tokenEndpoint = contract.properties.tokenEndpoint;
        this.grantTypes = contract.properties.grantTypes.filter(x => x === "implicit"); // Temporarily filter out other flows
    }
}