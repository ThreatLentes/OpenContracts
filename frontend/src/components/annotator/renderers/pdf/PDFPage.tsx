import { useRef, useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useAtom } from "jotai";
import { PageProps, TextSearchTokenResult } from "../../../types";
import { PDFPageRenderer, PageAnnotationsContainer, PageCanvas } from "./PDF";
import { Selection } from "../../display/components/Selection";
import { SearchResult } from "../../display/components/SearchResult";
import { BoundingBox, ServerTokenAnnotation } from "../../types/annotations";
import {
  useCreateAnnotation,
  usePdfAnnotations,
} from "../../hooks/AnnotationHooks";
import {
  scrollContainerRefAtom,
  usePages,
  useTextSearchState,
} from "../../context/DocumentAtom";
import {
  useAnnotationControls,
  useAnnotationDisplay,
  useZoomLevel,
  useAnnotationSelection,
} from "../../context/UISettingsAtom";
import { useAnnotationRefs } from "../../hooks/useAnnotationRefs";
import SelectionLayer from "./SelectionLayer";
import { PDFPageInfo } from "../../types/pdf";
import _ from "lodash";
import { useCorpusState } from "../../context/CorpusAtom";

/**
 * PDFPage Component
 *
 * Renders a single PDF page with annotations, selections, and search results.
 *
 * @param {PageProps} props - Properties for the PDF page.
 * @returns {JSX.Element} The rendered PDF page component.
 */
export const PDFPage = ({ pageInfo, read_only, onError }: PageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PDFPageRenderer | null>(null);
  const { pdfAnnotations } = usePdfAnnotations();
  const createAnnotation = useCreateAnnotation();

  const pageViewport = pageInfo.page.getViewport({ scale: 1 });
  const [pageBounds, setPageBounds] = useState<BoundingBox>({
    left: 0,
    top: 0,
    right: pageViewport.width,
    bottom: pageViewport.height,
  });
  const [hasPdfPageRendered, setPdfPageRendered] = useState(false);

  const { showStructural } = useAnnotationDisplay();
  const { zoomLevel } = useZoomLevel();
  const { selectedAnnotations } = useAnnotationSelection();

  const { annotationElementRefs, registerRef, unregisterRef } =
    useAnnotationRefs();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const annotations = pdfAnnotations.annotations;

  const [scrollContainerRef] = useAtom(scrollContainerRefAtom);
  const { pages, setPages } = usePages();

  const { textSearchMatches: searchResults, selectedTextSearchMatchIndex } =
    useTextSearchState();
  const { selectedCorpus } = useCorpusState();

  const annotationControls = useAnnotationControls();
  const { spanLabelsToView, activeSpanLabel } = annotationControls;

  const updatedPageInfo = useMemo(() => {
    return new PDFPageInfo(
      pageInfo.page,
      pageInfo.tokens,
      zoomLevel,
      pageBounds
    );
  }, [pageInfo.page, pageInfo.tokens, zoomLevel, pageBounds]);

  useEffect(() => {
    setPages((prevPages) => ({
      ...prevPages,
      [pageInfo.page.pageNumber - 1]: updatedPageInfo,
    }));
  }, [updatedPageInfo]);

  /**
   * Handles resizing of the PDF page canvas.
   */
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current === null || rendererRef.current === null) {
        onError(new Error("Canvas or renderer not available."));
        return;
      }

      // Get new viewport
      const viewport = pageInfo.page.getViewport({ scale: zoomLevel });

      // Update canvas dimensions
      canvasRef.current.width = viewport.width;
      canvasRef.current.height = viewport.height;

      // Re-render the page
      rendererRef.current.rescaleAndRender(zoomLevel);
    };

    if (!hasPdfPageRendered && canvasRef.current && pageContainerRef.current) {
      // console.log("Try to initialize page", pageInfo);
      const initializePage = async () => {
        try {
          // console.log(`PDFPage ${pageInfo.page.pageNumber}: Starting render`);
          if (pageContainerRef.current && canvasRef.current) {
            // console.log("\tSetup the renderer...");

            rendererRef.current = new PDFPageRenderer(
              pageInfo.page,
              canvasRef.current,
              onError
            );

            // Get viewport with desired zoom level
            const viewport = pageInfo.page.getViewport({ scale: zoomLevel });

            // Set canvas dimensions to match viewport
            canvasRef.current.width = viewport.width;
            canvasRef.current.height = viewport.height;

            // Set page bounds
            setPageBounds({
              left: 0,
              top: 0,
              right: viewport.width,
              bottom: viewport.height,
            });

            // console.log("\tAwait render...");
            await rendererRef.current.render(zoomLevel);

            if (!(pageInfo.page.pageNumber - 1 in pages)) {
              // console.log(`\tAdding pageInfo to ${pageInfo.page.pageNumber}`);
              setPages((prevPages) => ({
                ...prevPages,
                [pageInfo.page.pageNumber - 1]: pageInfo,
              }));
            }

            if (scrollContainerRef && scrollContainerRef.current) {
              // console.log(
              //   `\tAdding resize handler to page ${pageInfo.page.pageNumber}`
              // );
              scrollContainerRef.current.addEventListener(
                "resize",
                handleResize
              );
            }

            registerRef(
              "pdfPageContainer",
              canvasRef,
              pageInfo.page.pageNumber - 1
            );

            setPdfPageRendered(true);
          }
        } catch (error) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      };
      initializePage();

      return () => {
        unregisterRef("pdfPageContainer", pageInfo.page.pageNumber - 1);
        if (scrollContainerRef && scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener(
            "resize",
            handleResize
          );
        }
      };
    } else if (
      hasPdfPageRendered &&
      canvasRef.current &&
      pageContainerRef.current
    ) {
      handleResize();
    }
  }, [hasPdfPageRendered, zoomLevel, onError, pageInfo.page]);

  // Register and unregister the page container ref
  useEffect(() => {
    registerRef("pdfPageContainer", pageContainerRef, pageInfo.page.pageNumber);
    return () => {
      unregisterRef("pdfPageContainer", pageInfo.page.pageNumber);
    };
  }, [registerRef, unregisterRef, pageInfo.page.pageNumber]);

  /**
   * Scrolls to the selected annotation when there is exactly one selected.
   */
  useLayoutEffect(() => {
    const selectedId = selectedAnnotations[0];
    if (
      selectedAnnotations.length === 1 &&
      annotationElementRefs.current[selectedId]
    ) {
      annotationElementRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedAnnotations, annotationElementRefs]);

  useEffect(() => {
    if (hasPdfPageRendered && selectedAnnotations.length === 1) {
      annotationElementRefs.current[selectedAnnotations[0]]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [hasPdfPageRendered, selectedAnnotations, annotationElementRefs]);

  const annots_to_render = useMemo(() => {
    const defined_annotations = _.uniqBy(
      annotations
        .filter((annot) => annot instanceof ServerTokenAnnotation)
        .filter(
          (a) =>
            (a as ServerTokenAnnotation).json[pageInfo.page.pageNumber - 1] !==
            undefined
        ),
      "id"
    );

    const filtered_by_structural = !showStructural
      ? defined_annotations.filter((annot) => !annot.structural)
      : defined_annotations;

    return spanLabelsToView && spanLabelsToView.length > 0
      ? filtered_by_structural.filter((annot) =>
          spanLabelsToView!.some(
            (label) => label.id === annot.annotationLabel.id
          )
        )
      : filtered_by_structural;
  }, [annotations, pageInfo.page.pageNumber, showStructural, spanLabelsToView]);

  const page_annotation_components = useMemo(() => {
    if (!hasPdfPageRendered || !zoomLevel || !pageBounds || !annotations)
      return [];

    return annots_to_render.map((annotation) => (
      <Selection
        key={annotation.id}
        selected={selectedAnnotations.includes(annotation.id)}
        pageInfo={updatedPageInfo}
        annotation={annotation}
        approved={annotation.approved}
        rejected={annotation.rejected}
        allowFeedback={selectedCorpus?.allowComments}
        scrollIntoView={selectedAnnotations[0] === annotation.id}
      />
    ));
  }, [
    zoomLevel,
    pageBounds,
    annotations,
    annots_to_render,
    selectedAnnotations,
  ]);

  return (
    <PageAnnotationsContainer
      className="PageAnnotationsContainer"
      ref={pageContainerRef}
      style={{ position: "relative" }}
    >
      <PageCanvas ref={canvasRef} />
      <SelectionLayer
        pageInfo={updatedPageInfo}
        read_only={read_only}
        activeSpanLabel={activeSpanLabel ?? null}
        createAnnotation={createAnnotation}
        pageNumber={pageInfo.page.pageNumber - 1}
      />

      {page_annotation_components}

      {zoomLevel &&
        pageBounds &&
        searchResults
          .filter((match): match is TextSearchTokenResult => "tokens" in match)
          .filter(
            (match) => match.tokens[pageInfo.page.pageNumber - 1] !== undefined
          )
          .map((match) => {
            const isHidden = match.id !== selectedTextSearchMatchIndex;

            return (
              <SearchResult
                key={match.id}
                total_results={searchResults.length}
                showBoundingBox={true}
                hidden={isHidden}
                pageInfo={updatedPageInfo}
                match={match}
              />
            );
          })}
    </PageAnnotationsContainer>
  );
};
