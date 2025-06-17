export interface JwtPayload {
    name: string;
    sub: number;
    uid: number;
    iss: string;
    iat: number;
    exp: number;
}
