export const USER_ROLES = ['CUSTOMER','CREATOR','AGENCY_ADMIN','AGENCY_MEMBER','ADMIN'] as const;
export type UserRole = typeof USER_ROLES[number];
export const BOOKING_STATES = ['REQUESTED','QUOTED','AWAITING_PAYMENT','CONFIRMED','IN_PROGRESS','DELIVERED','REVISION_REQUESTED','COMPLETED','CANCELLED','REJECTED','EXPIRED','DISPUTED'] as const;
export type BookingState = typeof BOOKING_STATES[number];
export const BOOKING_TRANSITIONS: Record<BookingState, readonly BookingState[]> = {
  REQUESTED:['QUOTED','REJECTED','CANCELLED','EXPIRED'],QUOTED:['AWAITING_PAYMENT','REJECTED','CANCELLED','EXPIRED'],AWAITING_PAYMENT:['CONFIRMED','CANCELLED','EXPIRED'],CONFIRMED:['IN_PROGRESS','CANCELLED','DISPUTED'],IN_PROGRESS:['DELIVERED','DISPUTED','CANCELLED'],DELIVERED:['REVISION_REQUESTED','COMPLETED','DISPUTED'],REVISION_REQUESTED:['IN_PROGRESS','DISPUTED'],COMPLETED:['DISPUTED'],CANCELLED:[],REJECTED:[],EXPIRED:[],DISPUTED:['COMPLETED','CANCELLED']
};
export function canTransitionBooking(from:BookingState,to:BookingState):boolean {return BOOKING_TRANSITIONS[from].includes(to);}
export const DISTRICTS = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'] as const;
export function formatLkr(amountMinor:number):string{return new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR'}).format(amountMinor/100);}
