export type TripRequestStatus = 'pending' | 'canceled';

export interface TripRequest {
  id: string;
  requesterName: string;
  origin: string;
  destination: string;
  departureAt: string;
  returnAt: string;
  purpose: string;
  passengerCount: number;
  status: TripRequestStatus;
  createdAt: string;
}

export type CreateTripRequestInput = Pick<
  TripRequest,
  | 'requesterName'
  | 'origin'
  | 'destination'
  | 'departureAt'
  | 'returnAt'
  | 'purpose'
  | 'passengerCount'
>;
