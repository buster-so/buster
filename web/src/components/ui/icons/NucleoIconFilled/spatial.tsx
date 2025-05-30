import type { iconProps } from './iconProps';

function spatial(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spatial';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.63,4.148L10.38,1.683c-.852-.493-1.908-.493-2.76,0L3.37,4.148c-.845,.49-1.37,1.402-1.37,2.378v4.946c0,.977,.525,1.888,1.37,2.379l4.25,2.465c.426,.247,.903,.37,1.38,.37s.954-.124,1.38-.37l4.25-2.465c.845-.49,1.37-1.402,1.37-2.378V6.527c0-.977-.525-1.888-1.37-2.379Zm-.13,2.379v1.03l-4-2.31,1.521-.878,1.856,1.076c.384,.223,.623,.638,.623,1.082Zm-6.127-3.546c.388-.225,.868-.225,1.254,0l.897,.52-4.024,2.323v-1.757l1.873-1.086h0Zm-4.25,2.465l.877-.509v4.64l-1.5-.866v-2.185c0-.444,.239-.858,.623-1.081Zm-.623,6.027v-1.03l4,2.31-1.521,.878-1.856-1.076c-.384-.223-.623-.638-.623-1.082Zm6.127,3.546c-.388,.225-.868,.225-1.254,0l-.897-.52,1.893-1.093s0,0,.001,0l2.13-1.23v1.758l-1.873,1.086Zm4.25-2.465l-.877,.509v-4.641l1.5,.866v2.185c0,.444-.239,.858-.623,1.081Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default spatial;
