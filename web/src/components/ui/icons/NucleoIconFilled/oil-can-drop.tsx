import type { iconProps } from './iconProps';

function oilCanDrop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px oil can drop';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.451,13.16c-.169-.178-.343-.361-.505-.565-.096-.119-.296-.119-.392,0-.162,.204-.336,.387-.505,.565-.516,.543-1.049,1.105-1.049,2.068,0,.977,.785,1.772,1.75,1.772s1.75-.795,1.75-1.772c0-.963-.533-1.525-1.049-2.068Z"
          fill="currentColor"
        />
        <path
          d="M17.86,6.314c-.2-.28-.563-.388-.883-.262l-5.139,2.011-.646-1.163c-.309-.555-.895-.9-1.53-.9H1.75c-.965,0-1.75,.785-1.75,1.75v1c0,1.517,1.233,2.75,2.75,2.75h.275c.129,1.398,1.294,2.5,2.725,2.5h5.072c.811,0,1.576-.355,2.1-.974l4.901-5.792c.222-.262,.237-.641,.037-.92ZM1.5,8.75v-1c0-.138,.112-.25,.25-.25h1.25v2.5h-.25c-.689,0-1.25-.561-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M4.25,3.5h1.75v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default oilCanDrop;
