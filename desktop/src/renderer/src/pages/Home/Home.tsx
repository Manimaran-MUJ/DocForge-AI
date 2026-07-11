import Header from '../../components/common/Header/Header'
import FilePicker from '../../components/home/FilePicker/FilePicker'
import OptionPanel from '../../components/home/OptionPanel/OptionPanel'

function Home() {
  return (
    <>
      <Header />

      <FilePicker label="Markdown File" placeholder="Select Markdown file..." buttonText="Browse" />

      <FilePicker label="Output File" placeholder="Professional.docx" buttonText="Browse" />

      <OptionPanel />
    </>
  )
}

export default Home
