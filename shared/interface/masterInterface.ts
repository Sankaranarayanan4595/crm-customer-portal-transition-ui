export interface industry {
  success: boolean;
  data: any[];
   
    cCategory_Name: string;
    cCategory_Desc: string;
    iSortOrder: number;
    cImg_src: string; 
    bActive: boolean;
    dCreatedAt: Date; 
  }
  export interface portalDetails {
    success: boolean;
    data: any[];
    _id?: string; 
    cPortal_name: string;
    cPortal_Desc: string;
    cImg_src?: string;
    iSortOrder: number;
    bActive: boolean;
    dCreatedAt?: Date; 
    cFeaturesDesc?: string; 
    cDisplay_name?: string; 
    cRedirct_page?: string; 
    app_id?: string; 
  }
  export interface EsignConfig {
    success: boolean;
    data: any[];
    _id?: string; 
    cRole_Name: string;
    cEMail_Id: string[];
    cName: string;
    iSortOrder_Id: number;
    bActive: boolean;
    bFinalizerEmail: boolean;
    oProductCategory_Product_MappingID: string; 
}



export interface LeadsProductCategoryProductMapping  {
  data: any[];
  cFeaturesDesc: string;
  cDisplayName: string;
  oCategoryID: string;
  cAccountManagerMailIds: string[];
  cSalesBcc: string[];
  cSalesCC: string[];
  bSendMailToAccountManagers: boolean;
  oAMMailTemplateID: string;
  oCustomerMailTemplateID: string;
  bSendMailToCustomer: boolean;
  cCustomerBcc: string[];
  cCustomerCC: string[];
  cImg_src: string;
  iSortOrder: number;
  bActive: boolean;
  dCreatedAt: Date;
  oPortalID: string;
  oUserID: string[];
}

export interface LeadsRole  {
  cRole_Name: string;
  dCreateAt: Date;
  bActive: boolean;
}

export interface ActivationStatus  {
  data: any;
  cStatus_Name: string;
  bActive: boolean;
}
export interface DocumentTypeName  {
  data: any;
  cDocument_Type: string;
  bActive: boolean;
}
export interface RolesData  {
  data: any;
  cRole_Name: string;
  bActive: boolean;
}
export interface MailTemplateData  {
  data: any;
  cRole_Name: string;
  bActive: boolean;
}
export interface TaxMaster  {
  data: any;
  cTermName: string;
  bActive: boolean;
}
export interface TermsMaster  {
  data: any;
  cTermName: string;
  bActive: boolean;
}
export interface AdditionalCharges  {
  data: any;
  cadditionalCharges: string;
  bActive: boolean;
}

export interface PaymentModeMaster  {
  data: any;
  cPaymentMode: string;
  bActive: boolean;
}

export interface DepartmentTypeName  {
  data: any;
  cDepartment: string;
  bActive: boolean;
}
export interface OpportunityTypeName  {
  data: any;
  cOpportunity_Name: string;
  cOpportunity_Type: string;
  bActive: boolean;
}

export interface PhaseMaster  {
  data:any;
  cPhaseName: string;
  cPhaseDescription: string;
  bActive: boolean;
}