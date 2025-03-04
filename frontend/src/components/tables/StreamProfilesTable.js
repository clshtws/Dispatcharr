import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleFullScreenButton,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  Grid2,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Checkbox,
  Select,
  MenuItem,
} from '@mui/material';
import API from '../../api';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  SwapVert as SwapVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import useEPGsStore from '../../store/epgs';
import StreamProfileForm from '../forms/StreamProfile';
import useStreamProfilesStore from '../../store/streamProfiles';
import { TableHelper } from '../../helpers';
import useSettingsStore from '../../store/settings';
import useAlertStore from '../../store/alerts';

const StreamProfiles = () => {
  const [profile, setProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [activeFilterValue, setActiveFilterValue] = useState('all');

  const streamProfiles = useStreamProfilesStore((state) => state.profiles);
  const { settings } = useSettingsStore();
  const { showAlert } = useAlertStore();

  const columns = useMemo(
    //column definitions...
    () => [
      {
        header: 'Name',
        accessorKey: 'profile_name',
      },
      {
        header: 'Command',
        accessorKey: 'command',
      },
      {
        header: 'Parameters',
        accessorKey: 'parameters',
      },
      {
        header: 'Active',
        accessorKey: 'is_active',
        size: 100,
        sortingFn: 'basic',
        muiTableBodyCellProps: {
          align: 'left',
        },
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {cell.getValue() ? (
              <CheckIcon color="success" />
            ) : (
              <CloseIcon color="error" />
            )}
          </Box>
        ),
        Filter: ({ column }) => (
          <Box>
            <Select
              size="small"
              variant="standard"
              value={activeFilterValue}
              onChange={(e) => {
                setActiveFilterValue(e.target.value);
                column.setFilterValue(e.target.value);
              }}
              displayEmpty
              fullWidth
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </Box>
        ),
        filterFn: (row, _columnId, filterValue) => {
          if (filterValue == 'all') return true; // Show all if no filter
          return String(row.getValue('is_active')) === filterValue;
        },
      },
    ],
    []
  );

  //optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);

  const editStreamProfile = async (profile = null) => {
    setProfile(profile);
    setProfileModalOpen(true);
  };

  const deleteStreamProfile = async (id) => {
    if (id == settings['default-stream-profile'].value) {
      showAlert('Cannot delete default stream-profile', 'error');
      return;
    }

    await API.deleteStreamProfile(id);
  };

  const closeStreamProfileForm = () => {
    setProfile(null);
    setProfileModalOpen(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch (error) {
      console.error(error);
    }
  }, [sorting]);

  const table = useMaterialReactTable({
    ...TableHelper.defaultProperties,
    columns,
    data: streamProfiles,
    enablePagination: false,
    enableRowVirtualization: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      isLoading,
      sorting,
      rowSelection,
    },
    rowVirtualizerInstanceRef, //optional
    rowVirtualizerOptions: { overscan: 5 }, //optionally customize the row virtualizer
    initialState: {
      density: 'compact',
    },
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <>
        <IconButton
          size="small" // Makes the button smaller
          color="warning" // Red color for delete actions
          onClick={() => editStreamProfile(row.original)}
          sx={{ pt: 0, pb: 0 }}
        >
          <EditIcon fontSize="small" /> {/* Small icon size */}
        </IconButton>
        <IconButton
          size="small" // Makes the button smaller
          color="error" // Red color for delete actions
          onClick={() => deleteStreamProfile(row.original.id)}
          sx={{ pt: 0, pb: 0 }}
        >
          <DeleteIcon fontSize="small" /> {/* Small icon size */}
        </IconButton>
      </>
    ),
    muiTableContainerProps: {
      sx: {
        height: 'calc(100vh - 73px)', // Subtract padding to avoid cutoff
        overflowY: 'auto', // Internal scrolling for the table
      },
    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
        }}
      >
        <Typography>Stream Profiles</Typography>
        <Tooltip title="Add New Stream Profile">
          <IconButton
            size="small" // Makes the button smaller
            color="success" // Red color for delete actions
            variant="contained"
            onClick={() => editStreamProfile()}
          >
            <AddIcon fontSize="small" /> {/* Small icon size */}
          </IconButton>
        </Tooltip>
      </Stack>
    ),
  });

  return (
    <Box
      sx={{
        padding: 1,
      }}
    >
      <MaterialReactTable table={table} />

      <StreamProfileForm
        profile={profile}
        isOpen={profileModalOpen}
        onClose={closeStreamProfileForm}
      />
    </Box>
  );
};

export default StreamProfiles;
