import * as React from 'react'
const RadarChart = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 16 16" {...props}>
    <g id="radar-chart" clipPath="url(#clip0_6533_14)">
      <path
        id="Vector"
        stroke="currentColor"
        d="M5.66668 11.5L4.50001 7.41667L8.00001 5.08333L10.9167 7.41667L9.16668 10.3333M5.66668 11.5L9.16668 10.3333M5.66668 11.5L4.49999 14.5M9.16668 10.3333L12 14.5M8.00001 1.58333V5.66667M1.99999 6.83333L5.08335 7.41667M10.3333 7.41667L14 6.83333M8 1.53445L14.5 6.50001L12.0172 14.5345H3.98278L1.5 6.50001L8 1.53445Z"
      />
    </g>
    <defs>
      <clipPath id="clip0_6533_14">
        <rect width={16} height={16} fill="currentColor" />
      </clipPath>
    </defs>
  </svg>
)
export default RadarChart
