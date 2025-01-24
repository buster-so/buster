import { BusterTerm, BusterTermListItem } from '@/api/buster_rest';

export enum TermsResponses {
  '/terms/list:ListTerms' = '/terms/list:ListTerms',
  '/terms/get:GetTerm' = '/terms/get:GetTerm',
  '/terms/update:UpdateTerm' = '/terms/update:UpdateTerm',
  '/terms/post:PostTerm' = '/terms/post:PostTerm',
  '/terms/delete:DeleteTerm' = '/terms/delete:DeleteTerm'
}

export type TermsResponses_listTerms = {
  route: '/terms/list:ListTerms';
  callback: (d: BusterTermListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type TermResponses_getTerm = {
  route: '/terms/get:GetTerm';
  callback: (d: BusterTerm) => void;
  onError?: (d: unknown) => void;
};

export type TermResponses_updateTerm = {
  route: '/terms/update:UpdateTerm';
  callback: (d: BusterTerm) => void;
  onError?: (d: unknown) => void;
};

export type TermResponses_postTerm = {
  route: '/terms/post:PostTerm';
  callback: (d: BusterTerm) => void;
  onError?: (d: unknown) => void;
};

export type TermResponses_DeleteTerm = {
  route: '/terms/delete:DeleteTerm';
  callback: (d: { ids: string[] }) => void;
  onError?: (d: unknown) => void;
};

export type TermsResponseTypes =
  | TermsResponses_listTerms
  | TermResponses_getTerm
  | TermResponses_updateTerm
  | TermResponses_postTerm
  | TermResponses_DeleteTerm;
