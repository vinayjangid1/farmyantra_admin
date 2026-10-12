import { Box } from '@mui/material'

const PageContainer = ({ children, maxWidth = 1680 }) => (
  <Box
    sx={{
      width: '100%',
      maxWidth,
      mx: 'auto',
      pb: { xs: 2, md: 3 },
    }}
  >
    {children}
  </Box>
)

export default PageContainer
