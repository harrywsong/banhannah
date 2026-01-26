import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, FileText, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function FileViewer({ file, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfProxy, setPdfProxy] = useState(null);

  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef({});
  const isScrollingToPage = useRef(false);

  // Initialize PDF.js
  useEffect(() => {
    let isMounted = true;
    const url = file.viewUrl || `/api/files/view/${file.filename}`;

    const loadPdf = async () => {
      if (!window.pdfjsLib) {
        console.error('PDF.js not loaded');
        return;
      }

      try {
        setLoading(true);
        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfProxy(pdf);
          setNumPages(pdf.numPages);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        if (isMounted) setLoading(false);
      }
    };

    loadPdf();
    return () => { isMounted = false; };
  }, [file]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Scroll event listener for page tracking
  const handleScroll = useCallback(() => {
    if (isScrollingToPage.current || !scrollContainerRef.current || !numPages) return;

    const scrollContainer = scrollContainerRef.current;
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const viewportMiddle = containerTop + (scrollContainer.clientHeight / 3); // Check at 1/3 down the view

    let bestPage = 1;
    let minDistance = Infinity;

    for (let i = 1; i <= numPages; i++) {
      const pageEl = pageRefs.current[i];
      if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        // Calculate distance from the middle/top check point to the page's top
        const distance = Math.abs(rect.top - viewportMiddle);

        if (distance < minDistance) {
          minDistance = distance;
          bestPage = i;
        }
      }
    }

    if (bestPage !== currentPage) {
      setCurrentPage(bestPage);
    }
  }, [numPages, currentPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const scrollToPage = (pageNum) => {
    const element = pageRefs.current[pageNum];
    if (element && scrollContainerRef.current) {
      isScrollingToPage.current = true;
      setCurrentPage(pageNum);

      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Reset the flag after animation
      setTimeout(() => {
        isScrollingToPage.current = false;
      }, 800);
    }
  };

  const handlePrevPage = () => scrollToPage(Math.max(currentPage - 1, 1));
  const handleNextPage = () => scrollToPage(Math.min(currentPage + 1, numPages));

  // Page Component
  const PDFPage = ({ pageNumber, pdf, currentZoom }) => {
    const canvasRef = useRef(null);
    const [renderLoading, setRenderLoading] = useState(true);
    const intentId = useRef(0);

    useEffect(() => {
      const myId = ++intentId.current;
      let renderTask = null;

      const renderPage = async () => {
        try {
          const page = await pdf.getPage(pageNumber);
          if (myId !== intentId.current) return;

          const scale = (currentZoom / 100) * 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          context.clearRect(0, 0, canvas.width, canvas.height);

          renderTask = page.render(renderContext);
          await renderTask.promise;

          if (myId === intentId.current) {
            setRenderLoading(false);
          }
        } catch (error) {
          if (error.name !== 'RenderingCancelledException') {
            console.error(`Page ${pageNumber} render error:`, error);
          }
        }
      };

      setRenderLoading(true);
      renderPage();

      return () => {
        intentId.current++;
        if (renderTask) {
          renderTask.cancel();
        }
      };
    }, [pageNumber, pdf, currentZoom]);

    return (
      <div
        ref={el => pageRefs.current[pageNumber] = el}
        data-page={pageNumber}
        className="pdf-page-container flex flex-col items-center mb-12 last:mb-0"
      >
        <div className="relative bg-white shadow-2xl rounded-sm overflow-hidden" style={{ minWidth: '300px', minHeight: '400px' }}>
          {renderLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100/90 backdrop-blur-sm z-10 transition-opacity duration-300">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-2" />
            </div>
          )}
          <canvas ref={canvasRef} className="max-w-full h-auto block" />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-[#050505] z-50 flex flex-col animate-fade-in ${isFullscreen ? 'p-0' : ''}`}
    >
      {/* Header */}
      <div className="bg-neutral-900/40 backdrop-blur-3xl text-white px-6 py-2 shadow-2xl border-b border-white/5 relative z-30">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary-500/10 rounded-xl border border-primary-500/20 flex-shrink-0 shadow-2xl shadow-primary-500/5">
              <FileText className="h-5 w-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black tracking-tight truncate text-white/95 leading-none">{file.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-[9px] font-black text-neutral-400 uppercase tracking-widest border border-white/5">{file.format}</span>
                <span className="text-[10px] text-neutral-500 font-bold">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          </div>

          {!loading && (
            <div className="flex items-center gap-6">
              {/* Page Navigation */}
              <div className="flex items-center bg-black/50 rounded-full p-1 border border-white/10 shadow-2xl backdrop-blur-2xl">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center px-3 gap-2 font-mono font-black">
                  <span className="text-lg text-primary-400 min-w-[28px] text-center drop-shadow-[0_0_10px_#22c55e]">{currentPage}</span>
                  <span className="text-white/20 text-xs">/</span>
                  <span className="text-neutral-500 text-base">{numPages}</span>
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= numPages}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden lg:flex items-center bg-black/50 rounded-full p-1 border border-white/10 shadow-2xl backdrop-blur-2xl">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <div
                  className="px-3 min-w-[65px] text-center font-mono font-black text-primary-400 text-sm cursor-pointer hover:text-white transition-all hover:scale-105"
                  onClick={handleResetZoom}
                >
                  {zoom}%
                </div>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <div className="w-px h-6 bg-white/5 mx-1"></div>
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 active:scale-95 shadow-xl group"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 transition-transform group-hover:scale-110" /> : <Maximize2 className="h-4 w-4 transition-transform group-hover:scale-110" />}
              <span className="font-black hidden sm:inline text-[10px] uppercase tracking-[0.2em]">{isFullscreen ? "닫기" : "확대"}</span>
            </button>

            {!isFullscreen && (
              <button
                onClick={onClose}
                className="p-2 bg-red-500/5 hover:bg-red-500/20 text-neutral-500 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Viewer Content */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto bg-neutral-950 custom-scrollbar scroll-smooth ${isFullscreen ? 'p-0' : 'p-8 md:p-16'}`}
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <div className="relative">
              <div className="h-32 w-32 border-[8px] border-primary-500/5 border-t-primary-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-12 w-12 text-primary-500/40" />
              </div>
            </div>
            <p className="mt-10 text-3xl font-black tracking-tighter bg-gradient-to-br from-white to-white/10 bg-clip-text text-transparent italic animate-pulse">
              SYNCING WORKSPACE...
            </p>
          </div>
        ) : pdfProxy ? (
          <div className="max-w-fit mx-auto flex flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => (
              <PDFPage
                key={`${file.id}-v3-${i + 1}`}
                pageNumber={i + 1}
                pdf={pdfProxy}
                currentZoom={zoom}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-white max-w-lg p-16 bg-red-500/5 rounded-[60px] border border-red-500/10 backdrop-blur-3xl">
              <div className="inline-flex p-12 bg-red-500/10 rounded-[40px] mb-10 shadow-2xl shadow-red-500/20">
                <FileText className="h-24 w-24 text-red-500" />
              </div>
              <h3 className="text-5xl font-black mb-6 tracking-tighter">ACCESS DENIED</h3>
              <p className="text-red-500/50 mb-12 text-xl leading-relaxed font-bold uppercase tracking-widest">
                Document stream interrupted. Check connection.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <div className="bg-black/80 backdrop-blur-md border-t border-white/5 px-6 py-2">
          <div className="max-w-[1700px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div>
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]"></span>
              <div className="w-px h-3 bg-white/10"></div>
              <span className="text-[10px] font-black text-primary-500/30 uppercase tracking-[0.5em]">반혜나 교육</span>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 30px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
        }
      `}} />
    </div>
  );
}