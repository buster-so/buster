import type { iconProps } from './iconProps';

function pizzaSlice2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pizza slice 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.5,9c.965,0,1.75,.785,1.75,1.75s-.785,1.75-1.75,1.75v-3.5Z"
          fill="currentColor"
        />
        <path
          d="M15.471,7.644C13.025,4.114,9.177,1.892,4.913,1.547c-.494-.041-.987,.129-1.351,.464-.357,.33-.562,.797-.562,1.283V14.018c0,.633,.327,1.199,.875,1.516,.549,.316,1.201,.316,1.75,0l.875-.505v.222c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.655c0-.445-.24-.86-.626-1.083-.392-.226-.859-.225-1.249,0l-1.25,.721c-.108,.062-.203,.028-.25,0-.047-.027-.125-.091-.125-.216V5.8c3.019,.23,5.78,1.824,7.493,4.325l-1.618,.934c-.848,.49-1.375,1.402-1.375,2.381v2.81c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.81c0-.445,.239-.86,.625-1.083l3.787-2.187c.422-.244,.726-.657,.832-1.133,.108-.481,.008-.989-.273-1.395Z"
          fill="currentColor"
        />
        <circle cx="8" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default pizzaSlice2;
