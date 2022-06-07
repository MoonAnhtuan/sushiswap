import * as React from 'react'

export const CeloCircle = (props: React.ComponentProps<'svg'>) => (
  <svg width={128} height={128} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width={128} height={128} rx={64} fill="#2E3338" />
    <path
      d="M55.579 95.684c12.792 0 23.158-10.236 23.158-22.868 0-12.632-10.366-22.869-23.158-22.869-12.792 0-23.158 10.237-23.158 22.869S42.787 95.684 55.58 95.684Zm0 8.316C38.139 104 24 90.038 24 72.816s14.139-31.184 31.579-31.184 31.579 13.962 31.579 31.184S73.018 104 55.578 104Z"
      fill="#FBCC5C"
    />
    <path
      d="M72.421 79.053c12.792 0 23.158-10.237 23.158-22.869 0-12.631-10.366-22.868-23.158-22.868-12.791 0-23.158 10.236-23.158 22.868 0 12.632 10.367 22.869 23.158 22.869Zm0 8.315c-17.44 0-31.579-13.962-31.579-31.184S54.982 25 72.422 25C89.861 25 104 38.962 104 56.184S89.861 87.368 72.421 87.368Z"
      fill="#35D07F"
    />
    <path
      d="M73.465 87.368a22.66 22.66 0 0 0 4.59-8.989 23.28 23.28 0 0 0 9.103-4.532A30.626 30.626 0 0 1 84.7 84.949a31.767 31.767 0 0 1-11.234 2.42Zm-23.52-36.747a23.278 23.278 0 0 0-9.103 4.532 30.546 30.546 0 0 1 2.46-11.093 32.002 32.002 0 0 1 11.233-2.428 22.66 22.66 0 0 0-4.59 8.989Z"
      fill="#ECFF8F"
    />
  </svg>
)
