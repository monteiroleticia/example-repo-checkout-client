import { DinteroStatus } from "../models/enums/dinteroStatus";
import { PaymentStatus } from "../models/enums/paymentStatus";

export function mapDinteroStatus(dinteroStatus: string): PaymentStatus {
    switch (dinteroStatus as DinteroStatus) {
        case DinteroStatus.INITIALIZED:
        case DinteroStatus.ON_HOLD:
            return PaymentStatus.PENDING;
        case DinteroStatus.AUTHORIZED:
            return PaymentStatus.AUTHORIZED;
        case DinteroStatus.PARTIALLY_CAPTURED:
        case DinteroStatus.CAPTURED:
            return PaymentStatus.CAPTURED;
        case DinteroStatus.AUTHORIZATION_VOIDED:
            return PaymentStatus.CANCELLED;
        case DinteroStatus.PARTIALLY_REFUNDED:
        case DinteroStatus.REFUNDED:
            return PaymentStatus.REFUNDED;
        case DinteroStatus.REJECTED:
        case DinteroStatus.FAILED:
            return PaymentStatus.FAILED;
        default:
            return PaymentStatus.PENDING;
    }
}
