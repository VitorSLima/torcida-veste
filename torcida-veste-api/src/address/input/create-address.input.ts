export interface CreateAddressInput {
    zipCode: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood?: string | null;
    city: string;
    state: string;
}
