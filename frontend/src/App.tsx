import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import defaultPdf from '../document.pdf?url';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './App.css';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
type IconName = 'spark' | 'plus' | 'close' | 'menu' | 'chevronLeft' | 'chevronRight' | 'minus' | 'fit' | 'rotate' | 'download' | 'print' | 'more' | 'highlight' | 'underline' | 'strike' | 'chat' | 'send' | 'file' | 'arrow' | 'check' | 'settings' | 'trash' | 'book' | 'quote';
function Icon({ name, size = 20, ...props }: {
    name: IconName;
    size?: number;
    className?: string;
}) {
    const paths: Record<IconName, React.ReactNode> = {
        spark: <><path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z"/><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z"/></>,
        plus: <path d="M12 5v14M5 12h14"/>,
        close: <path d="m6 6 12 12M18 6 6 18"/>,
        menu: <><path d="M4 5h16M4 12h16M4 19h16"/></>,
        chevronLeft: <path d="m14 6-6 6 6 6"/>,
        chevronRight: <path d="m10 6 6 6-6 6"/>,
        minus: <path d="M5 12h14"/>,
        fit: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M7 12h10m-7-3-3 3 3 3m4-6 3 3-3 3"/></>,
        rotate: <><path d="M4 10a8 8 0 1 1 1.5 7M4 4v6h6"/><path d="m11 9 4 4-4 4-4-4 4-4Z"/></>,
        download: <><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/></>,
        print: <><path d="M7 8V3h10v5M7 17H4V9h16v8h-3"/><path d="M7 14h10v7H7zM17 11h.01"/></>,
        more: <><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>,
        highlight: <><path d="m15 3 6 6-10 10H5v-6L15 3Z"/><path d="m12 6 6 6M3 22h14"/></>,
        underline: <><path d="M6 3v8a6 6 0 0 0 12 0V3M4 22h16"/></>,
        strike: <><path d="M17 5c-1-2-9-3-10 2-.5 2 1 3 3 4m-6 1h16M7 19c2 2 10 3 10-2 0-1-.5-2-2-3"/></>,
        chat: <><path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.3-4.6A9 9 0 1 1 21 11.5Z"/><path d="M8 12h8m-4-4v8"/></>,
        send: <><path d="m3 3 19 9-19 9 4-9-4-9Z"/><path d="M7 12h15"/></>,
        file: <><path d="M14 3H5v18h14V8l-5-5Z"/><path d="M14 3v6h5M8 13h8m-8 4h5"/></>,
        arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
        check: <path d="m5 12 4 4L19 6"/>,
        settings: <><path d="m10 3-.7 2.2-2 .9-2.2-.5-2 3.4 1.5 1.8v2.4L3 15l2 3.4 2.3-.5 2 .9.7 2.2h4l.7-2.2 2-.9 2.3.5 2-3.4-1.6-1.8v-2.4L21 9l-2-3.4-2.3.5-2-.9L14 3h-4Z"/><circle cx="12" cy="12" r="3"/></>,
        trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></>,
        book: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15"/></>,
        quote: <><path d="M10 5H3v8h5c0 3-2 4-4 5M21 5h-7v8h5c0 3-2 4-4 5"/></>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
function IconButton({ icon, label, onClick, active, disabled, className = '' }: {
    icon: IconName;
    label: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    return <button type="button" className={`icon-button ${active ? 'active' : ''} ${className}`} title={label} aria-label={label} aria-pressed={active} onClick={onClick} disabled={disabled}><Icon name={icon}/></button>;
}
type PdfFile = {
    id: string;
    name: string;
    url: string;
    page: number;
    count: number;
    rotation: number;
};
type Message = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    page?: number;
    fileId?: string;
    quote?: string;
};
type Rectangle = {
    left: number;
    top: number;
    width: number;
    height: number;
};
function annotationStyle(rect: Rectangle, rotation: number): CSSProperties {
    let { left, top, width, height } = rect;
    if (rotation === 90) {
        [left, top, width, height] = [100 - top - height, left, height, width];
    }
    else if (rotation === 180) {
        [left, top] = [100 - left - width, 100 - top - height];
    }
    else if (rotation === 270) {
        [left, top, width, height] = [top, 100 - left - width, height, width];
    }
    return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
}
type Annotation = {
    id: string;
    fileId: string;
    page: number;
    rotation: number;
    tool: string;
    text: string;
    rectangles: Rectangle[];
};
const initialMessage: Message = {
    id: 'welcome', role: 'assistant',
    text: 'Un peu de clarté dans vos lectures.\n\nVotre document est prêt à être exploré. Sélectionnez un passage pour le citer dans la discussion, ou posez une question sur la page en cours.',
};
const suggestions = ['Résumer cette page', 'Expliquer un passage', 'Créer des questions de révision'];
export default function App() {
    const [files, setFiles] = useState<PdfFile[]>([{ id: 'default', name: 'Mon document.pdf', url: defaultPdf, page: 1, count: 0, rotation: 0 }]);
    const [activeId, setActiveId] = useState('default');
    const file = files.find(item => item.id === activeId)!;
    const [zoom, setZoom] = useState(100);
    const [pageInput, setPageInput] = useState('1');
    const [sidebar, setSidebar] = useState(false);
    const [navigationOpen, setNavigationOpen] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [draggingPdf, setDraggingPdf] = useState(false);
    const [tool, setTool] = useState('select');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedText, setSelectedText] = useState('');
    const [fullContext, setFullContext] = useState(true);
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [message, setMessage] = useState('');
    const [pageText, setPageText] = useState({ key: '', text: '' });
    const [busy, setBusy] = useState(false);
    const [menu, setMenu] = useState(false);
    const [settings, setSettings] = useState(false);
    const [toast, setToast] = useState('');
    const [viewerWidth, setViewerWidth] = useState(760);
    const [error, setError] = useState(false);
    const [comfortable, setComfortable] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigationRef = useRef<HTMLElement>(null);
    const navigationToggleRef = useRef<HTMLButtonElement>(null);
    const libraryToggleRef = useRef<HTMLButtonElement>(null);
    const libraryImportRef = useRef<HTMLButtonElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const blobUrls = useRef<string[]>([]);
    const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        const element = viewerRef.current;
        if (!element)
            return;
        const observer = new ResizeObserver(([entry]) => setViewerWidth(Math.max(200, entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    useEffect(() => { const element = chatScrollRef.current;
        element?.scrollTo({ top: element.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
    useEffect(() => {
        if (!toast)
            return;
        const timeout = setTimeout(() => setToast(''), 3500);
        return () => clearTimeout(timeout);
    }, [toast]);
    useEffect(() => () => {
        blobUrls.current.forEach(url => URL.revokeObjectURL(url));
        if (replyTimer.current)
            clearTimeout(replyTimer.current);
    }, []);
    useEffect(() => {
        if (!navigationOpen) return;
        const drawer = navigationRef.current;
        const previousFocus = document.activeElement;
        drawer?.querySelector<HTMLButtonElement>('button')?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setNavigationOpen(false);
            }
            if (event.key === 'Tab' && drawer) {
                const controls = Array.from(drawer.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (document.activeElement === document.body && previousFocus instanceof HTMLElement) previousFocus.focus();
        };
    }, [navigationOpen]);
    useEffect(() => {
        if (!libraryOpen) return;
        libraryImportRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setLibraryOpen(false);
                libraryToggleRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [libraryOpen]);
    const updateFile = (patch: Partial<PdfFile>) => setFiles(current => current.map(item => item.id === activeId ? { ...item, ...patch } : item));
    const goToPage = (value: number) => {
        const page = Math.max(1, Math.min(file.count || 1, value));
        updateFile({ page });
        setPageInput(String(page));
        setSelectedText('');
        setPageText({ key: '', text: '' });
        viewerRef.current?.scrollTo({ top: 0 });
    };
    const switchFile = (item: PdfFile) => {
        setLibraryOpen(false);
        setActiveId(item.id);
        setPageInput(String(item.page));
        setSelectedText('');
        setPageText({ key: '', text: '' });
        setError(false);
        viewerRef.current?.scrollTo({ top: 0 });
    };
    const openPdfFiles = (selectedFiles: File[]) => {
        const imported = selectedFiles.filter(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')).map(item => {
            const url = URL.createObjectURL(item);
            blobUrls.current.push(url);
            return { id: crypto.randomUUID(), name: item.name, url, page: 1, count: 0, rotation: 0 };
        });
        if (imported.length) {
            setFiles(current => [...current, ...imported]);
            switchFile(imported[0]);
        } else if (selectedFiles.length) {
            setToast('Choisissez un fichier au format PDF');
        }
        setDraggingPdf(false);
    };
    const importFiles = (event: ChangeEvent<HTMLInputElement>) => {
        openPdfFiles(Array.from(event.target.files || []));
        event.target.value = '';
    };
    const closeFile = (id: string) => {
        if (files.length === 1)
            return;
        const remaining = files.filter(item => item.id !== id);
        if (id === activeId)
            switchFile(remaining[Math.max(0, files.findIndex(item => item.id === id) - 1)]);
        setFiles(remaining);
    };
    const documentLoaded = async (pdf: PDFDocumentProxy) => {
        setError(false);
        setFiles(current => current.map(item => item.id === file.id ? { ...item, count: pdf.numPages } : item));
        try {
            const metadata = await pdf.getMetadata();
            const title = (metadata.info as {
                Title?: string;
            }).Title;
            if (file.id === 'default' && title?.trim() && !/untitled|microsoft word/i.test(title)) {
                setFiles(current => current.map(item => item.id === 'default' ? { ...item, name: `${title.replace(/\.pdf$/i, '')}.pdf` } : item));
            }
        }
        catch { /* Metadata is optional. */ }
    };
    const captureSelection = () => {
        const selection = window.getSelection();
        if (!selection || !pageRef.current || !selection.toString().trim() || !pageRef.current.contains(selection.anchorNode) || !pageRef.current.contains(selection.focusNode))
            return;
        const text = selection.toString().trim();
        setSelectedText(text);
        if (tool === 'select')
            return;
        const bounds = pageRef.current.getBoundingClientRect();
        const rectangles = Array.from(selection.getRangeAt(0).getClientRects()).filter(rect => rect.width > 0 && rect.height > 0).map(rect => ({ left: (rect.left - bounds.left) / bounds.width * 100, top: (rect.top - bounds.top) / bounds.height * 100, width: rect.width / bounds.width * 100, height: rect.height / bounds.height * 100 }));
        setAnnotations(current => [...current, { id: crypto.randomUUID(), fileId: file.id, page: file.page, rotation: file.rotation, tool, text, rectangles }]);
        selection.removeAllRanges();
        setToast('Annotation ajoutée à cette session');
    };
    const sendMessage = (text = message) => {
        if (!text.trim() || busy)
            return;
        const quote = selectedText;
        const sourceText = fullContext && pageText.key === `${file.id}:${file.page}` ? pageText.text : '';
        setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', text: text.trim(), quote, page: file.page, fileId: file.id }]);
        setMessage('');
        setSelectedText('');
        setBusy(true);
        replyTimer.current = setTimeout(() => {
            let reply = 'Le panneau de discussion est en mode démo. Pour obtenir une réponse personnalisée à cette question, il faut connecter un service IA au projet.';
            if (quote)
                reply += `\n\nVoici le passage que vous avez partagé :\n« ${quote.slice(0, 900)}${quote.length > 900 ? '…' : ''} »`;
            else if (sourceText.trim())
                reply += `\n\nLe texte de la page ${file.page} est bien accessible. En voici un extrait :\n« ${sourceText.trim().slice(0, 600)}${sourceText.length > 600 ? '…' : ''} »`;
            else if (!fullContext)
                reply += '\n\nLe contexte du document est désactivé. Activez-le pour inclure le texte de la page dans la discussion.';
            else
                reply += '\n\nCette page ne contient pas encore de texte exploitable. Vous pouvez essayer une autre page ou un PDF avec du texte sélectionnable.';
            setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', text: reply, page: quote || sourceText ? file.page : undefined, fileId: file.id }]);
            setBusy(false);
        }, 650);
    };
    const printPdf = () => {
        const printWindow = window.open(file.url, '_blank');
        if (printWindow)
            setToast('Le PDF est ouvert : utilisez le bouton Imprimer du lecteur.');
        else
            setToast('Autorisez l’ouverture du PDF dans votre navigateur pour l’imprimer.');
    };
    const currentAnnotations = annotations.filter(item => item.fileId === file.id && item.page === file.page);
    const fitWidth = Math.min(viewerWidth, 1000);
    return (<main className={`workspace ${comfortable ? 'comfortable' : ''}`}>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="visually-hidden" onChange={importFiles}/>

      <div className="workspace-panels">
        <section className="reader-panel" aria-label="Lecteur PDF">
          <div className="document-tabs">
            <button ref={navigationToggleRef} className="navigation-toggle" type="button" title="Ouvrir la navigation" aria-label="Ouvrir la navigation" aria-expanded={navigationOpen} aria-controls="workspace-navigation" onClick={() => { setLibraryOpen(false); setNavigationOpen(true); }}><Icon name="spark" size={20}/></button>
            <button ref={libraryToggleRef} className={`collection-label ${libraryOpen ? 'active' : ''}`} type="button" title="Ouvrir la bibliothèque" aria-expanded={libraryOpen} aria-controls="library-panel" onClick={() => setLibraryOpen(!libraryOpen)}><Icon name="book" size={17}/><span>Bibliothèque</span></button><div className="tabs-scroll" role="tablist" aria-label="Documents ouverts">{files.map(item => <div className={`document-tab ${item.id === activeId ? 'selected' : ''}`} key={item.id}><button role="tab" aria-selected={item.id === activeId} title={item.name} onClick={() => switchFile(item)}><Icon name="file" size={15}/><span>{item.name.replace(/\.pdf$/i, '')}</span></button>{files.length > 1 && <button className="close-tab" aria-label={`Fermer ${item.name}`} onClick={() => closeFile(item.id)}><Icon name="close" size={13}/></button>}</div>)}</div><IconButton icon="plus" label="Ouvrir un PDF" onClick={() => inputRef.current?.click()}/><IconButton icon="settings" label="Préférences" onClick={() => setSettings(true)}/></div>

          {libraryOpen && <>
            <button className="library-backdrop" type="button" aria-label="Fermer la bibliothèque" onClick={() => { setLibraryOpen(false); libraryToggleRef.current?.focus(); }}/>
            <aside className="library-panel" id="library-panel" aria-labelledby="library-title">
              <header className="library-heading"><div><span className="eyebrow">VOS LECTURES, AU MÊME ENDROIT</span><h2 id="library-title">Bibliothèque</h2></div><IconButton icon="close" label="Fermer la bibliothèque" onClick={() => { setLibraryOpen(false); libraryToggleRef.current?.focus(); }}/></header>
              <button ref={libraryImportRef} type="button" className={`library-import ${draggingPdf ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDraggingPdf(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingPdf(false); }} onDrop={event => { event.preventDefault(); openPdfFiles(Array.from(event.dataTransfer.files)); }}><span className="library-import-icon"><Icon name="plus" size={23}/></span><strong>Charger un PDF</strong><span>Choisir un fichier ou le glisser ici</span></button>
              <div className="library-list-heading"><span>DOCUMENTS OUVERTS</span><span>{files.length}</span></div>
              <div className="library-files">{files.map(item => <button type="button" className={`library-file ${item.id === activeId ? 'current' : ''}`} key={item.id} aria-current={item.id === activeId ? 'true' : undefined} onClick={() => { switchFile(item); libraryToggleRef.current?.focus(); }}><span className="library-file-icon"><Icon name="file" size={20}/></span><span className="library-file-info"><strong>{item.name}</strong><small>{item.count ? `${item.count} pages · Page ${item.page}` : 'PDF · Prêt à ouvrir'}</small></span><Icon name={item.id === activeId ? 'check' : 'arrow'} size={15}/></button>)}</div>
              <p className="library-note">Vos PDF restent sur votre appareil.<br/>Les documents importés sont disponibles pour cette session.</p>
            </aside>
          </>}

          <div className="pdf-toolbar"><IconButton icon="menu" label="Afficher les pages" active={sidebar} onClick={() => setSidebar(!sidebar)}/><span className="toolbar-filename" title={file.name}>{file.name}</span><div className="page-navigation"><IconButton icon="chevronLeft" label="Page précédente" onClick={() => goToPage(file.page - 1)} disabled={file.page <= 1}/><form onSubmit={(event: FormEvent) => { event.preventDefault(); goToPage(Number.parseInt(pageInput) || 1); }}><input aria-label="Numéro de page" inputMode="numeric" value={pageInput} onChange={event => setPageInput(event.target.value.replace(/\D/g, ''))} onBlur={() => goToPage(Number.parseInt(pageInput) || 1)}/></form><span className="page-total">/ &nbsp;{file.count || '—'}</span><IconButton icon="chevronRight" label="Page suivante" onClick={() => goToPage(file.page + 1)} disabled={!file.count || file.page >= file.count}/></div><span className="toolbar-separator"/><div className="zoom-controls"><IconButton icon="minus" label="Réduire le zoom" onClick={() => setZoom(value => Math.max(50, value - 10))} disabled={zoom <= 50}/><button className="zoom-value" title="Réinitialiser le zoom" onClick={() => setZoom(100)}>{zoom}%</button><IconButton icon="plus" label="Augmenter le zoom" onClick={() => setZoom(value => Math.min(200, value + 10))} disabled={zoom >= 200}/></div><span className="toolbar-separator secondary-separator"/><div className="toolbar-actions"><IconButton icon="fit" label="Ajuster à la largeur" onClick={() => { setZoom(100); setToast('Page ajustée à la largeur'); }}/><IconButton icon="rotate" label="Faire pivoter la page" onClick={() => updateFile({ rotation: (file.rotation + 90) % 360 })}/><a className="icon-button download-button" href={file.url} download={file.name} title="Télécharger le PDF" aria-label="Télécharger le PDF"><Icon name="download"/></a><IconButton icon="print" label="Ouvrir pour imprimer" onClick={printPdf}/><div className="menu-wrapper"><IconButton icon="more" label="Plus d’options" active={menu} onClick={() => setMenu(!menu)}/>{menu && <><button className="menu-backdrop" aria-label="Fermer le menu" onClick={() => setMenu(false)}/><div className="dropdown-menu"><button onClick={() => { setAnnotations(current => current.filter(item => item.fileId !== file.id)); setMenu(false); setToast('Annotations du document effacées'); }}><Icon name="trash" size={16}/>Effacer les annotations</button><button onClick={() => { goToPage(1); setMenu(false); }}><Icon name="book" size={16}/>Revenir à la première page</button></div></>}</div></div></div>

          <div className="reader-body"><aside className="annotation-toolbar" aria-label="Outils d’annotation"><IconButton icon="arrow" label="Sélectionner du texte" active={tool === 'select'} onClick={() => setTool('select')}/><span className="tools-divider"/><IconButton icon="chat" label="Citer la sélection dans la discussion" onClick={() => { if (selectedText)
        textareaRef.current?.focus();
    else
        setToast('Sélectionnez d’abord un passage dans le PDF'); }}/><IconButton icon="highlight" label="Surligner une sélection" active={tool === 'highlight'} onClick={() => { setTool(tool === 'highlight' ? 'select' : 'highlight'); setToast('Sélectionnez du texte à surligner'); }}/><IconButton icon="underline" label="Souligner une sélection" active={tool === 'underline'} onClick={() => { setTool(tool === 'underline' ? 'select' : 'underline'); setToast('Sélectionnez du texte à souligner'); }}/><IconButton icon="strike" label="Barrer une sélection" active={tool === 'strike'} onClick={() => { setTool(tool === 'strike' ? 'select' : 'strike'); setToast('Sélectionnez du texte à barrer'); }}/><div className="tool-color" title="Couleur des annotations : lavande"/><span className="annotation-bottom"><Icon name="file" size={16}/></span></aside>
          {sidebar && <aside className="page-sidebar"><div className="sidebar-heading">Pages <span>{file.count}</span></div><div className="page-list">{Array.from({ length: file.count }, (_, index) => <button className={file.page === index + 1 ? 'current' : ''} key={index} onClick={() => goToPage(index + 1)}><Icon name="file" size={17}/><span>Page {index + 1}</span>{file.page === index + 1 && <span className="current-page-dot"/>}</button>)}</div></aside>}
          <div className={`pdf-viewport tool-${tool}`} ref={viewerRef}><Document key={file.id} file={file.url} onLoadSuccess={documentLoaded} onItemClick={({ pageNumber }) => { if (pageNumber)
        goToPage(pageNumber); }} onLoadError={() => setError(true)} loading={<div className="pdf-state"><span className="loading-spinner"/>Ouverture de votre document…</div>} error={<div className="pdf-state error-state"><Icon name="file" size={32}/><h2>Impossible d’ouvrir ce PDF</h2><p>Le fichier est peut-être protégé ou endommagé.</p><button className="import-button" onClick={() => inputRef.current?.click()}>Choisir un autre PDF</button></div>}><div className="pdf-page-wrap" ref={pageRef} onMouseUp={captureSelection}><Page key={`${file.id}:${file.page}`} pageNumber={file.page} width={fitWidth * zoom / 100} rotate={file.rotation} onGetTextSuccess={content => setPageText({ key: `${file.id}:${file.page}`, text: content.items.map(item => 'str' in item ? item.str : '').join(' ') })} loading={<div className="pdf-state"><span className="loading-spinner"/>Chargement de la page…</div>}/><div className="annotations-layer" aria-hidden="true">{currentAnnotations.flatMap(annotation => annotation.rectangles.map((rectangle, index) => <span key={`${annotation.id}-${index}`} className={`pdf-annotation ${annotation.tool}`} data-rotation={(file.rotation - annotation.rotation + 360) % 360} style={annotationStyle(rectangle, (file.rotation - annotation.rotation + 360) % 360)}/>))}</div></div></Document>{!error && <div className="page-end">PAGE {file.page} <span>·</span> {file.count || '…'} PAGES</div>}</div></div>
          <footer className="reader-footer"><span><span className="status-dot"/>{error ? 'Erreur de lecture' : file.count ? 'Document prêt' : 'Chargement…'}</span><span className="reader-footer-hint">{tool === 'select' ? 'Sélectionnez un passage pour aller plus loin' : 'Les annotations sont conservées pendant cette session'}</span><span>PDF <span className="footer-key">{file.count || '—'} p.</span></span></footer>
        </section>

        <aside className="chat-panel" aria-label="Discussion avec Cortex"><header className="chat-header"><div className="assistant-title"><span className="assistant-logo"><Icon name="spark" size={21}/></span><div><h2>Cortex</h2><span>Votre compagnon de lecture</span></div></div><IconButton icon="plus" label="Nouvelle discussion" disabled={busy} onClick={() => { setMessages([initialMessage]); setSelectedText(''); setMessage(''); setToast('Nouvelle discussion'); }}/></header>
          <div className="context-bar"><span><Icon name="file" size={15}/>Contexte du document<button className="context-help" title="En mode démo, le texte de la page affichée peut être cité. Une connexion IA est nécessaire pour analyser tout le document." aria-label="À propos du contexte">?</button></span><button className={`toggle ${fullContext ? 'on' : ''}`} role="switch" aria-checked={fullContext} aria-label="Utiliser le contexte du document" onClick={() => setFullContext(!fullContext)}><span /></button></div>
          <div className="chat-scroll" ref={chatScrollRef}><div className="chat-date">VOTRE SESSION DE LECTURE</div>{messages.map(item => <article key={item.id} className={`message message-${item.role}`}><div className="message-author">{item.role === 'assistant' ? <><span className="message-avatar"><Icon name="spark" size={14}/></span><span>Cortex</span><span className="demo-badge">DÉMO</span></> : <><span>Vous</span><span className="user-message-avatar">Y</span></>}</div><div className="message-bubble">{item.quote && <blockquote>{item.quote}</blockquote>}{item.text.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}{item.page !== undefined && item.role === 'assistant' && <button className="source-link" onClick={() => { const source = files.find(source => source.id === item.fileId); if (source) {
        switchFile({ ...source, page: item.page! });
        setFiles(current => current.map(entry => entry.id === source.id ? { ...entry, page: item.page! } : entry));
    }
    else
        setToast('Le document source a été fermé'); }}><Icon name="file" size={12}/>Page {item.page}<Icon name="arrow" size={12}/></button>}</div></article>)}{messages.length === 1 && <div className="starter-section"><span>UN POINT DE DÉPART ?</span><div className="suggestion-list">{suggestions.map((suggestion, index) => <button key={suggestion} onClick={() => sendMessage(suggestion)}><Icon name={index === 0 ? 'file' : index === 1 ? 'chat' : 'book'} size={16}/><span>{suggestion}</span><Icon name="arrow" size={15}/></button>)}</div></div>}{busy && <div className="typing-indicator" aria-label="Préparation de la réponse" role="status"><span /><span /><span /></div>}</div>
          <div className="chat-composer-area">{selectedText && <div className="selected-quote"><Icon name="quote" size={14}/><span>{selectedText}</span><IconButton icon="close" label="Retirer la citation" onClick={() => setSelectedText('')}/></div>}<form className="chat-composer" onSubmit={event => { event.preventDefault(); sendMessage(); }}><textarea ref={textareaRef} value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        sendMessage();
    } }} aria-label="Votre message" placeholder="Une question, une idée à éclaircir…" rows={2}/><div className="composer-bottom"><span><span className={`context-dot ${fullContext ? 'enabled' : ''}`}/>{fullContext ? `Page ${file.page} en contexte` : 'Sans contexte'}</span><button type="submit" className="send-button" title="Envoyer le message" aria-label="Envoyer le message" disabled={!message.trim() || busy}><Icon name="send" size={17}/></button></div></form><p className="composer-disclaimer">Mode démo · Connectez une IA pour aller plus loin.</p></div>
        </aside>
      </div>
      {navigationOpen && <div className="navigation-overlay" onClick={() => setNavigationOpen(false)}>
        <aside ref={navigationRef} id="workspace-navigation" className="navigation-drawer" role="dialog" aria-modal="true" aria-labelledby="navigation-title" onClick={event => event.stopPropagation()}>
          <div className="navigation-heading"><div className="brand" id="navigation-title"><span className="brand-symbol"><Icon name="spark" size={23}/></span><span>cortex<span className="brand-dot">.</span></span></div><IconButton icon="close" label="Replier la navigation" onClick={() => setNavigationOpen(false)}/></div>
          <div className="navigation-workspace"><span className="workspace-avatar">M</span><span>Mon espace<small>Personnel</small></span></div>
          <nav className="navigation-links" aria-label="Navigation principale">
            <button type="button" onClick={() => { setNavigationOpen(false); navigationToggleRef.current?.focus(); }}><Icon name="book" size={18}/><span>Espace de lecture</span><Icon name="arrow" size={15}/></button>
            <button type="button" onClick={() => { setNavigationOpen(false); setLibraryOpen(true); }}><Icon name="file" size={18}/><span>Bibliothèque</span><span className="navigation-count">{files.length}</span></button>
            <button type="button" onClick={() => { setNavigationOpen(false); inputRef.current?.click(); }}><Icon name="plus" size={18}/><span>Importer un PDF</span></button>
          </nav>
          <div className="navigation-bottom"><p>Moins de friction.<br/>Plus de compréhension.</p><button type="button" className="navigation-profile" onClick={() => { setNavigationOpen(false); setSettings(true); }}><span className="profile-button">Y</span><span>Préférences de lecture</span><Icon name="settings" size={17}/></button></div>
        </aside>
      </div>}
      {toast && <div className="toast" role="status"><Icon name="check" size={17}/>{toast}</div>}
      {settings && <div className="modal-overlay" onClick={() => setSettings(false)}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape')
        setSettings(false); }}><div className="modal-heading"><span className="eyebrow">À VOTRE FAÇON</span><IconButton icon="close" label="Fermer les préférences" onClick={() => setSettings(false)}/></div><h2 id="settings-title">Un espace à votre rythme.</h2><p>Ajustez votre confort de lecture.</p><label className="setting-row"><span>Texte de discussion agrandi<small>Un peu plus d’espace pour vos idées.</small></span><input autoFocus type="checkbox" checked={comfortable} onChange={event => setComfortable(event.target.checked)}/></label><div className="settings-note"><Icon name="highlight" size={18}/><p>Vos annotations restent disponibles pendant cette session. Le téléchargement conserve le PDF original.</p></div><button className="import-button modal-done" onClick={() => setSettings(false)}>C’est parfait<Icon name="check" size={16}/></button></section></div>}
    </main>);
}
