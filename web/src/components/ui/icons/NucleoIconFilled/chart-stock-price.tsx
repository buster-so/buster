import type { iconProps } from './iconProps';

function chartStockPrice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart stock price';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.645,10.908l1.702-3.025c.115-.205,.319-.343,.552-.375,.234-.029,.466,.047,.632,.213l1.909,1.909,1.097-1.364c-.177-.299-.286-.643-.286-1.015,0-.837,.518-1.554,1.25-1.851V2H3.75c-1.517,0-2.75,1.233-2.75,2.75v1.552l3.645,4.606Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2h-1.25v3.399c.732,.298,1.25,1.014,1.25,1.851s-.518,1.554-1.25,1.851v6.899h1.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M11.5,9.46l-1.416,1.76c-.133,.166-.331,.267-.544,.279-.212,.009-.42-.068-.571-.219l-1.801-1.801-1.765,3.138c-.123,.218-.346,.36-.595,.38-.02,.001-.039,.002-.059,.002-.228,0-.445-.104-.588-.285l-3.162-3.996v4.53c0,1.517,1.233,2.75,2.75,2.75h7.75v-6.54Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartStockPrice;
