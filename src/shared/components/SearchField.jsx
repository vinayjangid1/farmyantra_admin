import { Box } from '@mui/material'
import { Search } from 'lucide-react'
import CustomTextField from '@/shared/components/CustomTextField'

const SearchField = ({
  value,
  onChange,
  label = 'Search',
  placeholder = 'Search...',
  maxWidth = { xs: '100%', sm: 400 },
  sx = {},
}) => (
  <Box sx={{ maxWidth, ...sx }}>
    <CustomTextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'text.secondary' }}>
            <Search size={16} />
          </Box>
        ),
      }}
    />
  </Box>
)

export default SearchField
