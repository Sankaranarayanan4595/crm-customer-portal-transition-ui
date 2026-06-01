// profileInterface.ts

export interface Profile {
  success: boolean;
  data: {
    cFirst_Name: string;
    cLast_Name: string;
    cEmail: string;
    cMobile: string;
    cCompany_Name: string;
    cAddress1: string;
    cAddress2: string;
    cPostal_Code: string;
    cCity: string;
    cState: string;
    cCountry: string;
    cComments: string;
  }[];
  
}
