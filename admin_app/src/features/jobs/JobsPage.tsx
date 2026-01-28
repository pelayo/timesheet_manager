import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ReplayIcon from '@mui/icons-material/Replay'
import InfoIcon from '@mui/icons-material/Info'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import HistoryIcon from '@mui/icons-material/History'
import type { Job } from '../../api/jobs'
import { createTeamworkImport, getJobs, retryJob, uploadTeamworkExcel } from '../../api/jobs'

export const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const data = await getJobs()
      setJobs(data)
    } catch (error) {
      console.error('Failed to fetch jobs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [])

  const handleRetry = async (id: string) => {
    try {
      await retryJob(id)
      fetchJobs()
    } catch (error) {
      console.error('Failed to retry job', error)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadTeamworkExcel(file)
      fetchJobs()
    } catch (error) {
      console.error('Failed to upload teamwork report', error)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleImportLastMonth = async () => {
    setImporting(true)
    try {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const since = lastMonth.toISOString().slice(0, 10)
      await createTeamworkImport(since)
      fetchJobs()
    } catch (error) {
      console.error('Failed to enqueue teamwork import', error)
    } finally {
      setImporting(false)
    }
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'active': return 'primary'
      case 'created': return 'default'
      case 'retry': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">System Jobs</Typography>
        <Box display="flex" gap={2}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            hidden
            onChange={handleFileChange}
          />
          <Button
            startIcon={<HistoryIcon />}
            onClick={handleImportLastMonth}
            disabled={importing}
          >
            Import Teamwork Last Month
          </Button>
          <Button
            startIcon={<UploadFileIcon />}
            onClick={handleUploadClick}
            disabled={uploading}
          >
            Upload Teamwork Excel
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={fetchJobs} disabled={loading}>
            Refresh
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Output</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.id.substring(0, 8)}...</TableCell>
                <TableCell>{job.name}</TableCell>
                <TableCell>
                  <Chip label={job.state} color={getStatusColor(job.state) as any} size="small" />
                </TableCell>
                <TableCell>{new Date(job.createdon).toLocaleString()}</TableCell>
                <TableCell>{job.completedon ? new Date(job.completedon).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  {job.output && (
                    <IconButton size="small" onClick={() => setSelectedJob(job)} title="Show output">
                      <InfoIcon />
                    </IconButton>
                  )}
                </TableCell>
                <TableCell>
                  {job.state === 'failed' && (
                    <IconButton size="small" onClick={() => handleRetry(job.id)} title="Retry">
                      <ReplayIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">No jobs found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} maxWidth="md" fullWidth>
        <DialogTitle>Job Output</DialogTitle>
        <DialogContent>
          <pre>{JSON.stringify(selectedJob?.output, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
